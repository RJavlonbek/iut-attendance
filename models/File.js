var keystone=require('keystone');
var Types=keystone.Field.Types;

var FileSchema=new keystone.List('File', {
	map: { name: 'name' },
	label:'file'
});


FileSchema.add({
	name:{
		type:String
	},
	teacher:{
		type:Types.Relationship,
		required:true,
		default:'not_set',
		ref:'Teacher'
	},
	url:{
		type: String
	}
});

FileSchema.defaultColumns='name';
FileSchema.register();