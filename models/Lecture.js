var keystone=require('keystone');
var Types=keystone.Field.Types;

var Lecture=new keystone.List('Lecture');

Lecture.add({
	section:{
		type:Types.Relationship,
		ref:'Section'
	},
	students:{
		type:Types.Relationship,
		ref:'Student',
		many:true
	},
	attendedStudents:{
		type:Types.Relationship,
		ref:'Student',
		many:true
	},
	teacher:{
		type:Types.Relationship,
		ref:'Teacher'
	},
	number:{
		type:Number
	},
	created_at:{
		type: Date,
		default:Date.now
	}
});

Lecture.defaultColumns='number';
Lecture.register();