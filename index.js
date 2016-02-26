exports.install = install;

function install(client) {

	client.mongodbServer = function(options, mongodb_init_args) {
		"use strict"
		options || (options = {});
		mongodb_init_args = Array.asArray(mongodb_init_args);

		const des = options.des || "通用Mongodb服务";
		const mongodb = require('mongodb');

		/*
		 * MongoClient
		 */
		client.registerComponent("Mongodb:Client", {
			des: des,
			methods: require("./lib/MongoClient").methods_doc,
		}, require("./lib/MongoClient").install(client));

		/*
		 * Collection
		 */
		client.registerComponent("Mongodb:Collection", {
			des: "collection 代理对象，被`db.collection`隐私调用",
			methods: require("./lib/MongodbCollection").methods_doc
		}, require("./lib/MongodbCollection").install(client));

		/*
		 * Cursor
		 */

		client.registerComponent("Mongodb:Cursor", {
			des: "cursor 代理对象，被`collection.find`隐私调用",
			methods: require("./lib/MongoCursor").methods_doc
		}, require("./lib/MongoCursor").install(client));

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
					app_name = client.using_app.app_name;
					args = []
				}
		}
		return client.initComponent(app_name, "Mongodb:Client", args).then(db_proxy => {
			client.afterOrderComponentProxy(db_proxy, "collection", collection_config => {
				return initCollectionComponent([collection_config]);
			});
		});
	};

	function initCollectionComponent(args) {
		return client.initComponent(app_name, "Mongodb:Collection", args).then(collection_proxy => {
			client.afterOrderComponentProxy(collection_proxy, "find", cursor_config => {
				return initCursorComponent([cursor_config]);
			});
		});
	};

	function initCursorComponent(args) {
		return client.initComponent(app_name, "Mongodb:Cursor", args).then(cursor_proxy => {
			require("./lib/MongoCursor").methods_doc.forEach(method => {
				if (!method.returns.length || method.returns[0].type !== "{Cursor}") {
					return
				}
				client.afterOrderComponentProxy(cursor_proxy, method.name, cursor_config => {
					return cursor_proxy;
				});
			});
		});
	};
};


// install({})