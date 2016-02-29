"use strict";
const ServerMap = require("./MongoClient").ServerMap;
const CursorMap = require("./MongoCursor").CursorMap;

/*
 * Collection
 */
var JSON_to_query = require("./JSON_to_query");
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
			this.server_id = collection_config.id;
			this.server = server;
			this.db = server.db;

			const col = server.collectionsMap.get(collection_config.name)
			if (!col) {
				Throw("ref", `${collection_config.name} has not references to Mongodb:Collection`);
			}
			this.col = col;
		}

		find(query) {
			JSON_to_query(query);

			const cursor = this.col.find(query);
			const cursor_id = cursor[cursor_id_symbol] = $$.uuid("Mongodb-CURSOR-ID")
			const res = {
				cursor_id: cursor_id,
			}
			CursorMap.set(cursor_id, cursor);
			return res;
		}

		[client.destroy_symbol]() {
			this.server.collectionsMap.delete(this.col.name);
			return true;
		}
	};

	const to_mongo_obj_params_keys_map = [
		"query",
		"filter",
		"update",
	].reduce((res, key) => {
		res[key] = true;
		return res
	}, Object.create(null));

	collection_methods_with_promise.reduce(function(proto, method_info) {
		if (method_info.params && method_info.params.some((param, i) => to_mongo_obj_params_keys_map[param.name])) {
			proto[method_info.name] = function() {
				const col = this.col;
				const args = Array.slice(arguments);
				console.log("args:", args);

				args.forEach(function(mongo_obj) {
					JSON_to_query(mongo_obj);
				});

				return col[method_info.name].apply(col, args);
			}
		} else {
			proto[method_info.name] = function() {
				const col = this.col;
				return col[method_info.name].apply(col, arguments);
			}
		}
		return proto;
	}, MongodbCollection.prototype);

	return MongodbCollection;
};

exports.install = install;
exports.methods_doc = collection_methods_with_promise.concat(collection_apis.filter(api_item => api_item.name === "find"));