
import { useEffect, useState, useCallback } from 'react';
import { courseService } from '../services/courseService';
import { useStore } from '../store/useStore';
import { Course } from '../types';

export const useCourses = () => {
  const [loading, setLoading] = useState(false);
  const { courses, setCourses, addCourse: addCourseToStore, user, enrollCourse: enrollStore } = useStore();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  }, [setCourses]);

  // Initial fetch
  useEffect(() => {
    if (courses.length === 0) {
        fetchCourses();
    }
  }, [fetchCourses, courses.length]);

  const createCourse = async (courseData: Partial<Course>) => {
    if (!user) throw new Error("Must be logged in");
    
    setLoading(true);
    try {
      const newCourse = await courseService.createCourse(courseData, user.id, user.name);
      addCourseToStore(newCourse);
      return newCourse;
    } finally {
      setLoading(false);
    }
  };

  const generateCourse = async (courseData: any) => {
    if (!user) throw new Error("Must be logged in");

    setLoading(true);
    try {
        const newCourse = await courseService.createGeneratedCourse(courseData, user.id, user.name);
        addCourseToStore(newCourse);
        return newCourse;
    } finally {
        setLoading(false);
    }
  };

  const enroll = async (courseId: string) => {
    if (!user) throw new Error("Must be logged in");
    setLoading(true);
    try {
        await courseService.enrollUser(user.id, courseId);
        enrollStore(courseId); // Update local store
        // Optionally refresh user data to get updated enrollments from DB source of truth
    } finally {
        setLoading(false);
    }
  };

  return { courses, loading, fetchCourses, createCourse, generateCourse, enroll };
};
