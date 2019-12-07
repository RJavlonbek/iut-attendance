var keystone=require('keystone');
var Types=keystone.Field.Types;

var Section=new keystone.List('Section',{
	map: { name: 'number' },
	label:'Section',
	autokey: { path: 'slug', from: 'number', unique: true }
});

Section.add({
	number:{
		type:String,
		required:true,
		default:'section number'
	},
	groups:{
		type:Types.Relationship,
		ref:'Group',
		many:true
	},
	teacher:{
		type:Types.Relationship,
		ref:'Teacher'
	},
	course:{
		type:Types.Relationship,
		ref:'Course'
	},
	lecturesPerWeek:{
		type:Number,
		default:1
	},
	lectureOne:{
		day:{
			label:'Day of first lecture',
			type:Types.Select,
			numeric:true,
			options:[{
				value:1,
				label:'Monday'
			},{
				value:2,
				label:'Tuesday'
			},{
				value:3,
				label:'Wednesday'
			},{
				value:4,
				label:'Thursday'
			},{
				value:5,
				label:'Friday'
			},{
				value:6,
				label:'Saturday'
			},],
			dependsOn:{$gte:{lecturesPerWeek:1}}
		},
		time:{
			label:'Starting time of first lecture (hh:mm)',
			type:String,
			dependsOn:{$gte:{lecturesPerWeek:1}}
		}
	},
	lectureTwo:{
		day:{
			label:'Day of second lecture',
			type:Types.Select,
			numeric:true,
			options:[{
				value:1,
				label:'Monday'
			},{
				value:2,
				label:'Tuesday'
			},{
				value:3,
				label:'Wednesday'
			},{
				value:4,
				label:'Thursday'
			},{
				value:5,
				label:'Friday'
			},{
				value:6,
				label:'Saturday'
			},],
			dependsOn:{$gte:{lecturesPerWeek:2}}
		},
		time:{
			label:'Starting time of second lecture (hh:mm)',
			type:String,
			dependsOn:{$gte:{lecturesPerWeek:2}}
		}
	}
});

Section.defaultColumns='number course teacher';
Section.register();