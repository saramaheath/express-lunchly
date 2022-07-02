"use strict";

/** Reservation for Lunchly */

const moment = require("moment");
const Customer = require("./customer");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  /** save reservation  */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
                 start_at=$2,
                 num_guests=$3,
                 notes=$4
             WHERE id = $5`,
        [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
      );
    }
  }

  static async getBestCustomers() {
    const results = await db.query(
      `SELECT c.id, c.first_name AS "firstName", c.last_name AS "lastName", c.phone, c.notes, COUNT(r.id) AS "num_reservations"
        FROM customers AS "c"
        LEFT JOIN reservations AS "r" ON c.id = r.customer_id
        GROUP BY c.id
        ORDER BY num_reservations DESC
        LIMIT 10`
    );

    for(let r of results.rows){
      delete r.num_reservations; 
    }
    debugger;
    return results.rows.map((c) => Customer.get(c.id));
  }
}

module.exports = Reservation;
