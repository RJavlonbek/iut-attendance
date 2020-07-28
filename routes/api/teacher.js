const https = require("https");
const querystring = require("querystring");
const async = require("async");
const FormData = require("form-data");
const fs = require("fs");
const XLSX = require("xlsx");

var keystone = require("keystone");
var Section = keystone.list("Section").model;
var Teacher = keystone.list("Teacher").model;
var Lecture = keystone.list("Lecture").model;
var Student = keystone.list("Student").model;
var File = keystone.list("File").model;
var Course = keystone.list("Course").model;

var teacherAPI = {
	startAttendance: function (req, res, next) {
		// sends current lecture id as a token
		var teacherId = req.params.teacherId || "";
		//res.send('starting attendance');
		console.log("....starting attendance");
		Teacher.findOne({ teacherId: teacherId }, function (err, teacher) {
			if (err) return next(err);
			if (!(teacher && teacher._id)) {
				return res.json({
					status: "error",
					message: "Teacher not found (" + teacherId + ")",
				});
			}

			console.log(
				"teacher found " + teacher.firstname + " " + teacher.lastname
			);
			const now = new Date();
			const currentDay = now.getDay(); // 0 to 6, (Sunday is 0)
			const currentHour = now.getHours(); // 0 to 23
			const currentMin = now.getMinutes(); // 0 to 59
			var regexHour = "/^" + currentHour + "/";

			// Section.findOne({
			// 	$or:[{
			// 		'lectureOne.day':currentDay
			// 		// 'lectureOne.time':{$regex:regexHour}
			// 	},{
			// 		'lectureTwo.day':currentDay
			// 		// 'lectureTwo.time':{$regex:regexHour}
			// 	}]
			// })
			Section.find(
				{ teacher: teacher._id },
				"lectureOne lectureTwo groups number teacher"
			)
				.populate({
					path: "course",
					select: ["title"],
				})
				.populate({
					path: "groups",
					select: "title",
				})
				.exec(function (err, sections) {
					if (!(sections && sections.length)) {
						return res.json({
							status: "error",
							message: "No sections found for teacher(" + teacherId + ")",
						});
					}

					console.log(sections.length + " sections found");

					// find section that has the nearest lectureTime with currentTime
					let nearestSection = {};
					let dayDistance = 6;
					let nearestDay = "";
					let lecturesOfNearestDay = [];

					// much powerful algorithm needed here
					let i = currentDay;
					let testCount = 0;
					while (!nearestDay || testCount <= 7) {
						if (i < 0) {
							i += 6;
						}
						if (
							sections.filter((s) => {
								if (s.lectureOne.day == i || s.lectureTwo.day == i) {
									return true;
								} else {
									return false;
								}
							}).length
						) {
							nearestDay = i;
						} else {
							i--;
						}
						testCount++;
					}

					console.log("nearestDay: " + nearestDay);

					// getting lectures of nearest day
					sections.map((s) => {
						let lecture = "";
						if (s.lectureOne.day == nearestDay) {
							lecture = s.lectureOne;
						}
						if (s.lectureTwo.day == nearestDay) {
							lecture = s.lectureTwo;
						}

						if (lecture) {
							lecturesOfNearestDay.push({
								time: lecture.time,
								day: lecture.day,
								section: s,
								room: lecture.room,
							});
						}
					});
					console.log(
						lecturesOfNearestDay.length + " lectures found for nearest day"
					);

					// sorting lectures
					lecturesOfNearestDay.sort((l1, l2) => {
						let hour1 = l1.time.split(":")[0] / 1;
						let hour2 = l2.time.split(":")[0] / 1;
						if (hour1 < hour2) {
							return -1;
						} else {
							return 1;
						}
					});

					if (currentDay == nearestDay) {
						// find the lecture that was started latest

						console.log("finding lecture for today");
						console.log("current hour: " + currentHour);
						console.log("current minute: " + currentMin);

						let lecturesOfTodayTillNow = lecturesOfNearestDay.filter((l) => {
							let hour = l.time.split(":")[0] / 1;
							let min = l.time.split(":")[1] / 1;
							if (
								hour <= currentHour &&
								min <= (currentHour - hour) * 60 + currentMin
							) {
								return true;
							} else {
								return false;
							}
						});
						console.log(
							lecturesOfTodayTillNow.length +
							" lectures found for today till now"
						);

						if (lecturesOfTodayTillNow.length) {
							lecturesOfNearestDay = lecturesOfTodayTillNow;
						}
					}

					// last lecture of that day, we will take
					nearestSection =
						lecturesOfNearestDay[lecturesOfNearestDay.length - 1];

					console.log("nearest section found...");
					//console.log(nearestSection);

					var section = nearestSection.section;

					Lecture.findOne(
						{
							section: section._id,
						},
						"students created_at attendedStudents number",
						{
							$sort: { created_at: -1 },
						}
					)
						.populate({
							path: "students",
							select: ["studentId", "firstname", "lastname"],
						})
						.exec((err, lecture) => {
							if (lecture && lecture._id) {
								return res.json({
									status: "success",
									message: "existing lecture",
									students: lecture.students.map((s, i) => {
										return {
											_id: s._id,
											studentId: s.studentId,
											firstname: s.firstname,
											lastname: s.lastname,
										};
									}),
									section: {
										_id: section._id,
										number: section.number,
									},
									course: {
										_id: section.course._id,
										title: section.course.title,
									},
									lectureId: lecture._id,
									number: lecture.number,
									groups: section.groups.map((g, i) => {
										return {
											_id: g._id,
											title: g.title,
										};
									}),
									room: nearestSection.room,
									day: nearestSection.day,
									time: nearestSection.time,
								});
							}

							// create new lecture
							Lecture.count(
								{
									section: section._id,
								},
								(err, lecturesCount) => {
									// counting lectures
									if (err) return next(err);
									console.log(
										lecturesCount + " lectures found for this section"
									);
									Student.find(
										{
											group: { $in: section.groups },
										},
										"studentId firstname lastname",
										(err, students) => {
											//finding students of this section
											if (err) return next(err);
											// if(!(students && students.length)){
											// 	return res.json({
											// 		status:'error',
											// 		message:'No students found',
											// 		result:students
											// 	});
											// }

											console.log(students.length + " students found");
											console.log("creating lecture");
											var newLecture = new Lecture({
												students: students.map((st, index) => st._id),
												section: section._id,
												attendedStudents: [],
												teacher: section.teacher,
												number: lecturesCount + 1,
											});

											newLecture.save(function (err, newLect) {
												if (err) return next(err);
												return res.json({
													status: "success",
													message: "new lecture",
													students: students.map((s, i) => {
														return {
															_id: s._id,
															studentId: s.studentId,
															firstname: s.firstname,
															lastname: s.lastname,
														};
													}),
													section: {
														_id: section._id,
														number: section.number,
													},
													course: {
														_id: section.course._id,
														title: section.course.title,
													},
													lectureId: newLect._id,
													number: newLect.number,
													groups: section.groups.map((g, i) => {
														return {
															_id: g._id,
															title: g.title,
														};
													}),
													room: nearestSection.room,
													day: nearestSection.day,
													time: nearestSection.time,
												});
											});
										}
									);
								}
							);
						});
				});
		});
	},
	login: function (req, res, next) {
		var b = req.body;
		console.log(b);
		async.parallel(
			{
				teacher: function (cb) {
					Teacher.findOne(
						{
							teacherId: b.teacherId,
						},
						function (err, teacher) {
							if (err) return next(err);
							cb(null, teacher);
						}
					);
				},
				student: function (cb) {
					Student.findOne(
						{
							studentId: b.teacherId,
						},
						function (err, student) {
							if (err) return next(err);
							cb(null, student);
						}
					);
				},
			},
			function (err, results) {
				if (err) return next(err);
				let response = {};
				let user = {};
				let teacherId = "";
				if (results.teacher && results.teacher._id) {
					response.userType = "teacher";
					user = results.teacher;
					teacherId = user.teacherId;
				} else if (results.student && results.student._id) {
					response.userType = "student";
					user = results.student;
					teacherId = user.studentId;
				} else {
					return res.json({
						status: "error",
						message: "user not found",
					});
				}

				response.user = {
					_id: user._id,
					teacherId,
					firstname: user.firstname,
					lastname: user.lastname,
					token: user.token
				};

				if (user._) {
					user._.password.compare(b.password, function (err, match) {
						if (err) return next(new Error("Error on comparing password: " + err));
						if (match) {
							Student.update({ _id: user._id }, {
								$set: {
									token: b.token
								}
							}, (err, updatedStudent) => {
								if (err) console.log(err + "Could not add token");
								console.log("Student info updated");
							})
							res.json({
								...response,
								status: "success",
								message: "signed in",
							});
							console.log(response);
						} else {
							return res.json({
								status: "error",
								message: "incorrect credentials",
							});
						}
					});
				}
			}
		);
	},
	getTimetable: function (req, res, next) {
		const teacherId = req.params.teacherId || "";
		console.log("getting timetable for instructor " + teacherId);

		async.parallel(
			{
				student: (cb) => {
					Student.findOne({ studentId: teacherId }, "_id group", cb);
				},
				teacher: (cb) => {
					Teacher.findOne({ teacherId }, "_id firstname lastname", cb);
				},
			},
			(err, results) => {
				if (err) return next(err);
				const { teacher, student } = results;

				if (teacher && teacher._id) {
					Section.find(
						{
							teacher: teacher._id,
						},
						"number lectureOne lectureTwo"
					)
						.populate({
							path: "groups",
							select: ["title"],
						})
						.populate({
							path: "course",
							select: ["title"],
						})
						.exec((err, sections) => {
							if (err) return next(err);
							let lectures = [];
							sections = sections.map((section, index) => {
								return {
									number: section.number,
									groups: section.groups,
									course: section.course,
									lectures: [section.lectureOne, section.lectureTwo],
									teacher: {
										firstname: teacher.firstname,
										lastname: teacher.lastname,
									},
								};
							});
							res.json(sections);
						});
				} else if (student && student._id) {
					Section.find(
						{
							groups: student.group,
						},
						"number lectureOne lectureTwo"
					)
						.populate({
							path: "groups",
							select: ["title"],
						})
						.populate({
							path: "course",
							select: ["title"],
						})
						.populate({
							path: "teacher",
							select: ["firstname", "lastname"],
						})
						.exec((err, sections) => {
							if (err) return next(err);
							let lectures = [];
							sections = sections.map((section, index) => {
								return {
									number: section.number,
									groups: section.groups,
									course: section.course,
									lectures: [section.lectureOne, section.lectureTwo],
									teacher: {
										firstname: section.teacher.firstname,
										lastname: section.teacher.lastname,
									},
								};
							});
							res.json(sections);
						});
				} else {
					res.json({
						result: "error",
						message: "user was not found for given id " + teacherId,
					});
				}
			}
		);
	},
	getReport: (req, res, next) => {
		let aoa = [];
		const { excel, lectureId } = req.query;
		let jsonData = [
			{ prop: "val", prop1: "val1" },
			{ prop: "val2", prop1: "vall" },
		];

		if (lectureId) {
			console.log("lecture id is given: " + lectureId);

			Lecture.findById(req.query.lectureId, "number students attendedStudents")
				.populate({
					path: "students",
					select: ["studentId"],
				})
				.populate({
					path: "section",
					select: ["number"],
					populate: { path: "course", select: ["title"] },
				})
				.exec((err, lecture) => {
					if (!(lecture && lecture._id)) {
						return res.json({
							status: "error",
							message: "lecture not found",
						});
					}

					lecture.students.map((student, i) => {
						let attended = lecture.attendedStudents.indexOf(student._id) != -1;
						aoa.push([student.studentId, attended ? "P" : "A"]);
					});

					if (excel) {
						// adding header
						aoa.unshift(["Student ID", "Lecture " + lecture.number]);

						/* generate workbook */
						var ws = XLSX.utils.aoa_to_sheet(aoa);
						var wb = XLSX.utils.book_new();
						XLSX.utils.book_append_sheet(
							wb,
							ws,
							lecture.section.course.title + " " + lecture.section.number
						);

						/* generate buffer */
						var buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

						/* send to client */
						let filename =
							lecture.section.course.title
								.split(" ")
								.map((part, i) => part[0])
								.join("") +
							"-" +
							lecture.section.number +
							".xlsx";
						res.set("Content-disposition", "attachment; filename=" + filename);
						return res.status(200).send(buf);
					} else {
						return res.json({
							status: "success",
							message: "",
							data: aoa,
							course: lecture.section.course.title,
							section: lecture.section.number,
							lecture: lecture.number,
						});
					}
				});
		} else {
			return res.json({
				status: "error",
				message: "lack of data",
			});
		}
	},
	findCourses: (req, res, next) => {
		const teacherId = req.params.teacherId || "";

		Course.find({}, "title", (err, courses) => {
			if (err) return next(err);
			return res.json(courses);
		});
	},
	findSections: (req, res, next) => {
		const teacherId = req.params.teacherId || "";

		Teacher.findOne({ teacherId }, (err, teacher) => {
			Section.find({ teacher: teacher._id }, "number")
				.populate({
					path: "course",
					select: "title",
				})
				.exec((err, sections) => {
					if (err) return next(err);
					return res.json(sections);
				});
		});
	},
	fileUpload: function (req, res, next) {
		let file = req.files.file;
		let teacherId = req.params.teacherId;
		let { courseId, title } = req.body;

		// eliminating double quotes
		if (courseId.length == 26) {
			courseId = courseId.substring(1, 25);
		}
		if (title[0] == '"' && title[title.length - 1] == '"') {
			title = title.substring(1, title.length - 1);
		}

		if (!(file && file.originalname)) {
			return res.json({
				result: "error",
				message: "file was not given",
			});
		}

		let extension = file.originalname.split(".").pop();
		console.log("extension: " + extension);

		async.parallel(
			{
				course: (cb) => {
					Course.findById(courseId, "", cb);
				},
				teacher: (cb) => {
					Teacher.findOne({ teacherId }, "", cb);
				},
			},
			(err, results) => {
				if (err) return next(err);
				const { teacher, course } = results;
				if (!(teacher && teacher._id)) {
					return res.json({
						status: "error",
						message: "teacher not found",
					});
				}
				if (!(course && course._id)) {
					return res.json({
						status: "error",
						message: "invalid courseId, course not found",
					});
				}

				let newFile = new File({
					name: title || file.originalname,
					teacher: teacher._id,
					course: course._id,
				});

				newFile.url =
					"https://iut-files.mis.uz/files/iut-attendance/" +
					newFile._id +
					"." +
					extension;

				newFile.save((err, f) => {
					if (err) return next(err);
					res.json({
						status: "success",
						message:
							"file informations are saved, now you should send this file to https://iut-files.mis.uz/file-upload.php with given filename",
						filename: f._id + "." + extension,
					});
				});
			}
		);
	},
	findFiles: (req, res, next) => {
		const teacherId = req.params.teacherId || "";

		Teacher.findOne({ teacherId }, (err, teacher) => {
			File.find({ teacher: teacher._id }, "name url")
				.populate({
					path: "course",
					select: ["title"],
				})
				.exec((err, files) => {
					if (err) return next(err);
					return res.json(files);
				});
		});
	},
	fileUploadWithRequest: function (req, res, next) {
		let b = req.body;
		let file = req.files.file;

		if (!(file && file.originalname)) {
			return res.json({
				result: "error",
				message: "all data is not provided",
			});
		}

		let f = new File({
			name: file.originalname,
			teacher: b.teacherId,
		});

		console.log("requesting to iut-files.mis.uz ...");
		//return res.json(file);
		data = new FormData();
		//data.append('file', fs.createReadStream(file.path));
		data.append("my_string", "my_value");

		console.log("formData is ready...");
		const options = {
			hostname: "iut-files.mis.uz",
			path: "/file-upload.php",
			method: "POST",
		};

		const myReq = https.request(options);

		data.pipe(myReq);

		//

		myReq.on("error", (error) => {
			console.error(error);
		});

		myReq.on("response", (myRes) => {
			console.log(`statusCode: ${myRes.statusCode}`);

			myRes.on("data", (d) => {
				console.log("request to iut-files.mis.uz finished...");
				process.stdout.write(d);
			});

			res.json({
				status: "success",
				message: "file-uploaded",
			});
		});

		//myReq.write(data);
		myReq.end();
	},
};

module.exports = teacherAPI;
