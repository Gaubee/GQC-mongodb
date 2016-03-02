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

	} catch (err) {

		console.log(err);
	}

}));