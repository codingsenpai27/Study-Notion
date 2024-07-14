const RatingAndReview = require("../models/RatingAndRaview");
const Course = require("../models/Course");
const { mongo, default: mongoose, Mongoose } = require("mongoose");

//createRating
exports.createRating=async(req,res)=>{
    try{
        //fetch userid
        const userId=req.body.id;

        //fetch data
        const{rating,review,courseId}=req.body;

        //check if user is enrollled in course
        const courseDetails=await Course.findOne(
                                    {_id:courseId,
                                    studentsEnrolled: {$elemMatch: {$eq: userId} },
                                    }
        );

        if(!courseDetails) {
            return res.status(404).json({
                success:false,
                message:'Student is not enrolled in the course',
            });
        }

        //check id user had review the course alreday

        const alreadyReviewed=await RatingAndReview.findOne({
                                                userId,
                                                courseId,
        });
        if(alreadyReviewed) {
            return res.status(403).json({
                success:false,
                message:'Course is already reviewed by the user',
            });
        }

        //create rating and review
        const ratingReview=await RatingAndReview.create({
                                        rating,review,
                                        user:userId,
                                        course:courseId,
        });

        //update course with rating and review
        const updatedCourseDetails=await Course.findByIdAndUpdate({courseId},
                                                    {
                                                        $push:{
                                                            ratingAndReviews:ratingReview>_id,
                                                        }
                                                    },
                                                    {new:true}
            
        )
        console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created Successfully",
            ratingReview,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
        
    }
}


//getAverageRating
exports.getAverageRating=async(req,res)=>{
    try{
        //get courseId
        const courseId=req.body.courseId;

        //Cal avg rating
        const result=await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg:"$rating"}
                }
            }
        ])

        //return rating
        if(result.length > 0) {

            return res.status(200).json({
                success:true,
                averageRating: result[0].averageRating,
            })

        }
        
        //if no rating/Review exist
        return res.status(200).json({
            success:true,
            message:'Average Rating is 0, no ratings given till now',
            averageRating:0,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}



//getAllRatingAndReviews

exports.getAllRating = async (req, res) => {
    try{
            const allReviews = await RatingAndReview.find({})
                                    .sort({rating: "desc"})
                                    .populate({
                                        path:"user",
                                        select:"firstName lastName email image",
                                    })
                                    .populate({
                                        path:"course",
                                        select: "courseName",
                                    })
                                    .exec();
            return res.status(200).json({
                success:true,
                message:"All reviews fetched successfully",
                data:allReviews,
            });
    }   
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    } 
}
