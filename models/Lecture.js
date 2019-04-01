var keystone=require('keystone');
var Types=keystone.Field.Types;

var Lecture=new keystone.List('Lecture');

Lecture.add({
	section:{
		type:Types.Relationship,
		ref:'Section'
	},
	students:{
		studentId:{
			type:Types.TextArray
		},
		attended:{
			type:Types.NumberArray,
			default:0
		}
	},
	teacher:{
		type:Types.Relationship,
		ref:'Teacher'
	},
	number:{
		type:Number
	}
});

Lecture.defaultColumns='number';
Lecture.register();