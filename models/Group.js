var keystone=require('keystone');
var Types=keystone.Field.Types;

var Group=new keystone.List('Group',{
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});


Group.add({
	title:{
		type:String,
		required:true
	}
});

Group.defaultColumns='title';
Group.register();