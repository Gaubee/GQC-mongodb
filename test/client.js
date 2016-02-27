require("GQ-core");
const tcp = require("GQ-core/tcp");
const gq_mongodb = require("../index.js");

const client = tcp.createClient({
	address: '0.0.0.0',
	family: 'IPv4',
	port: 4001
}, co.wrap(function*() {
	try {

		gq_mongodb.install(client);
		yield client.useApp("Gaubee", "123456", "QAQ");


		const db = yield client.mongodbClient(["mongodb://localhost:27017/test"]);

		const clo = yield db.collection("test_correctly_access_collections");

		// var _insert = yield clo.insert({
		// 	name: "Bangeel"
		// });
		// console.log(_insert);

		console.log(yield clo.find({}).toArray());
		console.log(yield clo.find({}).limit(2).skip(2).toArray());

		// yield cursor.destroy();
		yield clo.destroy();
		yield db.destroy();
		client.destroy();
	} catch (err) {

		console.log(err);
		process.exit(0);
	}

}));