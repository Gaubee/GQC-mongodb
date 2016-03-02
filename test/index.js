require("gq-core");
const tcp = require("gq-core/tcp");
const gq_mongodb = require("../index.js");

const client = tcp.createClient({
	address: '0.0.0.0',
	family: 'IPv4',
	port: 4001
}, co.wrap(function*() {
	try {

		gq_mongodb.install(client);
		yield client.useApp("Gaubee", "123456", "QAQ");
		yield client.mongodbServer();

		const db = yield client.mongodbClient(["mongodb://localhost:27017/test"]);

		const clo = yield db.collection("test_correctly_access_collections");

		// var _insert = yield clo.insert({
		// 	name: "Bangeel"
		// });
		// console.log(_insert);

		var cursor = clo.find({});
		// console.log(yield cursor.toArray());
		var cursor = clo.find({});
		// console.log(yield cursor.limit(2).skip(2).toArray());
		// var _find_res = yield(yield clo.find({})).limit(3).toArray();
		// console.log(_find_res);

		// yield cursor.destroy();
		yield clo.destroy();
		yield db.destroy();
		client.destroy();
	} catch (err) {

		console.log(err);
	}

}));