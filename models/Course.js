var keystone=require('keystone');
var Types=keystone.Field.Types;

var Course=new keystone.List('Course',{
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Course.add({
	title:{
		type:String,
		required:true,
		default:'Unnamed'
	}
});

Course.defaultColumns='number';
Course.register();