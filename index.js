exports.install = install;

function install(client) {

	client.mongodbServer = function(options) {
		"use strict"
		options || (options = {});

		const des = options.des || "通用Mongodb服务";

		/*
		 * MongoClient
		 */
		const c1 = client.registerComponent("Mongodb:Client", {
			des: des,
			methods: require("./lib/MongoClient").methods_doc,
		}, require("./lib/MongoClient").install(client));

		/*
		 * Collection
		 */
		const c2 = client.registerComponent("Mongodb:Collection", {
			des: "collection 代理对象，被`db.collection`隐私调用",
			methods: require("./lib/MongoCollection").methods_doc
		}, require("./lib/MongoCollection").install(client));

		/*
		 * Cursor
		 */

		const c3 = client.registerComponent("Mongodb:Cursor", {
			des: "cursor 代理对象，被`collection.find`隐私调用",
			methods: require("./lib/MongoCursor").methods_doc
		}, require("./lib/MongoCursor").install(client));

		return [c1, c2, c3];
	};

	var cursor_find_inited = false;
	const cursor_instance = Symbol("cursor_instance");
	const cursor_call_list = Symbol("cursor_call_list");
	const is_set_then = Symbol("is_set_then");
	const col_find_cursor_proto = {}

	function initCollectionFind() {
		const CursorMethodsWithCursorDoc = require("./lib/MongoCursor").methods_with_cursor_doc;

		CursorMethodsWithCursorDoc.reduce(function(proto, method_info) {
			proto[method_info.name] = function() {
				console.log(this)
				this[cursor_call_list].push({
					name: method_info.name,
					args: Array.slice(arguments)
				});
				if (!this[is_set_then]) {
					this[is_set_then] = true;
					this[cursor_instance].then((cursor_proxy) => {
						return cursor_proxy("multi-order", this[cursor_call_list].map(cursor_run_method_info => {
							return {
								type: "run-method",
								data: cursor_run_method_info
							}
						}));
					});
				}
				return this;
			};

			return proto;
		}, col_find_cursor_proto);

		const CursorMethodsWithPromiseDoc = require("./lib/MongoCursor").methods_with_promise_doc;

		CursorMethodsWithPromiseDoc.reduce(function(proto, method_info) {
			proto[method_info.name] = function() {
				return this[cursor_instance].then((cursor_proxy) => {
					return cursor_proxy[method_info.name].apply(cursor_proxy, arguments).then(cursor_res => {
						// 执行销毁
						return cursor_proxy.destroy().then(() => {
							// 返回Promise结果
							return cursor_res;
						});

					});
				});
			};
			return proto;
		}, col_find_cursor_proto);

	};

	client.mongodbClient = function(app_name, args) {

		switch (arguments.length) {
			case 0:
				app_name = client.using_app.app_name;
				args = [];
				break;
			case 1:
				if (String.isString(app_name)) {
					args = [];
				} else {
					args = Array.asArray(app_name);
					app_name = client.using_app.app_name;
				}
		}

		return client.initComponent(app_name, "Mongodb:Client", args).then(db_proxy => {
			client.afterOrderComponentProxy(db_proxy, "collection", collection_config => {
				return initCollectionComponent([collection_config]);
			});
			return db_proxy;
		});

		function initCollectionComponent(args) {
			if (!cursor_find_inited) {
				cursor_find_inited = true;
				initCollectionFind();
			}
			return client.initComponent(app_name, "Mongodb:Collection", args).then(collection_proxy => {
				client.rewriteOrderComponentProxy(collection_proxy, "find", (old_fun, args) => {
					const cursor_promise = old_fun.apply(this, args).then(cursor_config => {
						return initCursorComponent([cursor_config]);
					});

					return Object.assign({
						[cursor_call_list]: [],

						[cursor_instance]: cursor_promise,

					}, col_find_cursor_proto);
				});
				return collection_proxy;
			});
		};

		function initCursorComponent(args) {
			return client.initComponent(app_name, "Mongodb:Cursor", args).then(cursor_proxy => {
				require("./lib/MongoCursor").methods_doc.forEach(method => {
					if (!method.returns.length || method.returns[0].type !== "{Cursor}") {
						return
					}
					client.rewriteOrderComponentProxy(cursor_proxy, method.name, (old_fun, args) => {
						old_fun.apply(this, args);
						return cursor_proxy;
					});
				});
				return cursor_proxy;
			});
		};
	};

};


// install({})