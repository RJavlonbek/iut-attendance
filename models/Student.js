var keystone = require("keystone");
var Types = keystone.Field.Types;

var Student = new keystone.List("Student", {
	map: { name: "studentId" },
	label: "Student",
	autokey: { path: "slug", from: "firstname lastname", unique: true },
});

var myStorage = new keystone.Storage({
	adapter: keystone.Storage.Adapters.FS,
	fs: {
		path: keystone.expandPath("./public/uploads/students"),
		publicPath: "/public/uploads/students",
	},
});

Student.add({
	studentId: {
		type: String,
		required: true,
	},
	group: {
		type: Types.Relationship,
		ref: "Group",
	},
	photo: {
		type: Types.File,
		storage: myStorage,
	},
	firstname: {
		type: String,
	},
	lastname: {
		type: String,
	},
	password: {
		type: Types.Password,
		min: 4,
		rejectCommon: false,
	},
	status: {
		type: Number,
		default: 0  // 0 - Not attended (default) 1 - Attended 
	},
	token: {
		type: String,
		default: "",
	},
});

Student.defaultColumns = "studentId, firstname lastname, group";
Student.register();
