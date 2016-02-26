"use strict";
const ServerMap = require("./MongoClient").ServerMap;

/*
 * Collection
 */
const cursor_id_symbol = require("./MongoCursor").cursor_id_symbol;

const collection_apis = require("./Collection-API.json");

const collection_methods_with_promise = collection_apis.filter(function(api_item) {
	return api_item.returns.length && api_item.returns[0].type === "{Promise}";
});

function install(client) {
	class MongodbCollection {
		constructor(collection_config) {
			const server = ServerMap.get(collection_config.id);
			if (!server) {
				Throw("ref", `${collection_config.id} has not references to Mongodb:Client`);
			}
			this.server_id = id;
			this.server = server;
			this.db = server.db;

			const col = server.collectionsMap.get(collection_config.name)
			if (!col) {
				Throw("ref", `${collection_config.name} has not references to Mongodb:Collection`);
			}
			this.col = col;
		}

		find(query) {
			const cursor = this.col.find(query);
			const cursor_id = cursor[cursor_id_symbol] = $$.uuid("Mongodb-CURSOR-ID")
			const res = {
				cursor_id: cursor_id,
			}
			return res;
		}

		[client.destroy_symbol]() {
			this.server.collectionsMap.remove(this.col.name);
			return true;
		}
	};


	collection_methods_with_promise.reduce(function(proto, method_info) {
		proto[method_info.name] = function() {
			const col = this.col;
			return col[method_info.name].apply(col, arguments);
		}
		return proto;
	}, MongodbCollection.prototype);
	return MongodbCollection;
};

exports.install = install;
exports.methods_doc = collection_methods_with_promise.concat(collection_apis.filter(api_item => api_item.name === "find"));