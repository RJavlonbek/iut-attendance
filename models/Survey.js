const keystone=require('keystone');
let Types=keystone.Field.Types;

var SurveySchema = new keystone.List('Survey');

SurveySchema.add({
	title:{
		type:String
	},
	content:{
		type:Types.Text
	},
	student:{ // author
		type:Types.Relationship,
		ref:'Student'
	},
	teacher:{
		type:Types.Relationship,
		ref:'Teacher'
	},
	createdAt:{
		type:Types.Datetime,
		default: Date.now
	}
});

SurveySchema.defaultColumns='title, content, student';
SurveySchema.register();