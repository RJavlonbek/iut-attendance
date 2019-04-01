var keystone=require('keystone');
var Types=keystone.Field.Types;

var Teacher=new keystone.List('Teacher',{
	map: { name: 'teacherId' },
	label:'Teacher id (u12345)',
	autokey: { path: 'slug', from: 'teacherId', unique: true }
});

var myStorage= new keystone.Storage({
	adapter:keystone.Storage.Adapters.FS,
	fs:{
		path:keystone.expandPath('./public/uploads/teachers'),
		publicPath:'/public/uploads/teachers'
	}
});


Teacher.add({
	teacherId:{
		type:String,
		required:true,
		default:'not_set'
	},
	photo:{
		type:Types.File,
		storage:myStorage
	},
	firstname:{
		type:String
	},
	lastname:{
		type:String
	},
	password:{
		type:Types.Password
	}
});

Teacher.defaultColumns='id, group, firstname';
Teacher.register();