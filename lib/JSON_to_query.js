module.exports = JSON_to_query;
const mongodb = require("mongodb");

const BSON_TYPE = [
	"Binary",
	"Code",
	"Map",
	"DBRef",
	"Double",
	"Long",
	"MinKey",
	"MaxKey",
	"ObjectID",
	"ObjectId",
	"Symbol",
	"Timestamp",
];
const BSON_TYPE_MAP = BSON_TYPE.reduce((res, key) => {
	res[key] = true;
	return res;
}, Object.create(null));

function JSON_to_query(obj) {
	for (var key in obj) {
		var val = obj[key];
		if (val instanceof Array) {
			if (val[1] === "@" && BSON_TYPE_MAP[val[0]]) {
				obj[key] = mongodb[val[0]].apply(mongodb, val.slice(2));
			}
		} else if (typeof val === "object") {
			JSON_to_query(val)
		}
	}
	return obj;
};