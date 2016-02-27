"use strict";
/*
 * MongoClient
 */
function install(client) {
	const mongodb = require('mongodb');
	class MongoClient {
		constructor(connect_string) {
			return new Promise((resolve, reject) => {
				mongodb.connect(connect_string, (err, db) => {

					if (err) {
						reject(err);
					}

					this.db = db;
					this.collectionsMap = new Map();
					ServerMap.set(this.id = $$.uuid("Mongodb-DB-ID"), this);

					resolve(this);
				});
			});
		}

		collection(name, options) {
			const res = {
				id: this.id,
				name: name
			}
			if (this.collectionsMap.has(name)) {
				return res
			}
			return new Promise((resolve, reject) => {
				this.db.collection(name, options, (err, col) => {
					this.collectionsMap.set(name, col);
					resolve(res);
				});
			});
		}

		[client.destroy_symbol]() {
			this.collectionsMap.clear();
			return this.db.close()
		}
	};
	return MongoClient;
};

exports.install = install;
exports.methods_doc = []
const ServerMap = exports.ServerMap = new Map();