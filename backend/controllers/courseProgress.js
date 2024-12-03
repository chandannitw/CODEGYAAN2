import mongoose from "mongoose"
import Section from "../models/section.js"
import SubSection from "../models/SubSection.js"
import courseProgess from "../models/courseProgess.js"
import Course from "../models/course.js"

export const updateCourseProgress = async (req, res) => {
  const { courseId, subSectionId, id } = req.body
  const userId = id

  if (!courseId || !subSectionId || !userId) {
    console.log("Missing required fields");
    return res.status(400).json({ message: "Missing required fields", success: false })
  } 
  try {
    // Check if the subsection is valid
    const subsection = await SubSection.findById(subSectionId)
    if (!subsection) {
      return res.status(404).json({ error: "Invalid subsection" })
    }
    // console.log(userId,courseId,subSectionId);
    // Find the course progress document for the user and course
    let courseProgress = await courseProgess.findOne({  
      courseId: courseId,
      userId: userId,
    })

    if (!courseProgress) {
      // If course progress doesn't exist, create a new one
      return res.status(404).json({
        success: false,
        message: "Course progress Does Not Exist",
      })
    } else {
      // If course progress exists, check if the subsection is already completed
      if (courseProgress.completedVideos.includes(subSectionId)) {
        return res.status(400).json({ message: "Video already completed" , success : false})
      }

      // Push the subsection into the completedVideos array
      courseProgress.completedVideos.push(subSectionId)
    }

    // Save the updated course progress
    await courseProgress.save()

    return res.status(200).json({ message: "Course progress updated", success : true})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: error.message , success : false})
  }
}

export const getProgressPercentage = async (req, res) => {
  const { courseId } = req.body
  const userId = req.user.id

  if (!courseId) {
    return res.status(400).json({ error: "Course ID not provided." })
  }

  try {
    // Find the course progress document for the user and course
    let courseProgress = await courseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })
      .populate({
        path: "courseID",
        populate: {
          path: "courseContent",
        },
      })
      .exec()

    if (!courseProgress) {
      return res
        .status(400)
        .json({ error: "Can not find Course Progress with these IDs." })
    }
    console.log(courseProgress, userId)
    let lectures = 0
    courseProgress.courseID.courseContent?.forEach((sec) => {
      lectures += sec.subSection.length || 0
    })

    let progressPercentage =
      (courseProgress.completedVideos.length / lectures) * 100

    // To make it up to 2 decimal point
    const multiplier = Math.pow(10, 2)
    progressPercentage =
      Math.round(progressPercentage * multiplier) / multiplier

    return res.status(200).json({
      data: progressPercentage,
      message: "Succesfully fetched Course progress",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}