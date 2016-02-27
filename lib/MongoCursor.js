"use strict";
const cursor_apis = require("./Cursor-API.json");

const cursor_methods_with_promise = cursor_apis.filter(function(api_item) {
	return api_item.returns.length && api_item.returns[0].type === "{Promise}";
});
const cursor_methods_with_cursor = cursor_apis.filter(function(api_item) {
	return api_item.returns.length && api_item.returns[0].type === "{Cursor}";
});
/*
 * Cursor
 */
function install(client) {

	class MongoCursor {
		constructor(cursor_config) {
			console.log(cursor_config)
			const cursor = CursorMap.get(cursor_config.cursor_id);
			if (!cursor) {
				Throw("ref", `${cursor_config.cursor_id} has not references to Mongodb:Cursor`);
			}
			this.cursor = cursor;
		}

		[client.destroy_symbol]() {
			CursorMap.delete(this.cursor[cursor_id_symbol]);
			return this.cursor.close();
		}
	};

	cursor_methods_with_promise.reduce(function(proto, method_info) {
		proto[method_info.name] = function() {
			const cursor = this.cursor;
			const task_id = this[client.data_symbol].info.task_id;
			return cursor[method_info.name].apply(cursor, arguments);
		};
		return proto;
	}, MongoCursor.prototype);

	cursor_methods_with_cursor.reduce(function(proto, method_info) {
		proto[method_info.name] = function() {
			const cursor = this.cursor;
			cursor[method_info.name].apply(cursor, arguments);
			return {
				cursor_id: this.cursor[cursor_id_symbol]
			}
		};
		return proto;
	}, MongoCursor.prototype);
	return MongoCursor;
};


exports.install = install;
exports.methods_with_promise_doc = cursor_methods_with_promise;
exports.methods_with_cursor_doc = cursor_methods_with_cursor;
exports.methods_doc = cursor_methods_with_promise.concat(cursor_methods_with_cursor);
const CursorMap = exports.CursorMap = new Map();
const cursor_id_symbol = exports.cursor_id_symbol = Symbol("Cursor-Id");