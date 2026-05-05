
import React, { useState } from 'react';
import { UploadCloud, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Course } from '../../types';
import { cn } from '../../lib/utils';
import { courseService } from '../../services/courseService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";

interface CoursePublishControlProps {
    course: Course;
    onUpdate: () => void;
}

export const CoursePublishControl: React.FC<CoursePublishControlProps> = ({ course, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isPublished = course.isPublished;
    const isPending = course.approvalStatus === 'pending';

    const validateCourse = (): boolean => {
        if (!course.title || !course.description || !course.thumbnailUrl || !course.category || course.price < 0) {
            setValidationError("Please complete the course landing page details (Title, Description, Thumbnail, Category, Price) before publishing.");
            return false;
        }
        if (!course.syllabus || course.syllabus.length === 0) {
            setValidationError("Please add at least one module before publishing.");
            return false;
        }
        
        // Check for content
        const hasLessons = course.syllabus.some(m => m.lessons.length > 0);
        if (!hasLessons) {
            setValidationError("Please add at least one lesson to your modules.");
            return false;
        }

        const hasPublishedLessons = course.syllabus.some(m => m.lessons.some(l => l.isPublished));
        if (!hasPublishedLessons) {
            setValidationError("None of your lessons are published. Please publish at least one lesson content.");
            return false;
        }

        return true;
    };

    const handleAction = async () => {
        if (isPublished || isPending) {
            // Unpublish logic (revert to draft)
            if (!window.confirm("Are you sure you want to unpublish this course? It will no longer be visible to students.")) return;
            setLoading(true);
            try {
                await courseService.updateCourse(course.id, { isPublished: false });
                onUpdate();
            } finally {
                setLoading(false);
            }
        } else {
            // Publish logic
            if (!validateCourse()) {
                setConfirmOpen(true); // Reusing dialog for error display convenience or use specific alert
                return;
            }
            
            setLoading(true);
            try {
                await courseService.updateCourse(course.id, { isPublished: true });
                onUpdate();
            } catch (e) {
                alert("Failed to publish course");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <Button 
                onClick={handleAction} 
                isLoading={loading}
                variant={isPublished ? "outline" : "default"}
                className={cn(
                    "h-12 px-8 rounded-2xl font-black transition-all active:scale-95 shadow-xl",
                    isPublished 
                        ? "border-red-100 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 shadow-red-900/5" 
                        : "bg-ueu-navy hover:bg-ueu-blue text-white shadow-blue-900/10"
                )}
            >
                {isPublished ? (
                    <div className="flex items-center gap-2">
                        <UploadCloud className="h-4 w-4 rotate-180" />
                        Unpublish Course
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <UploadCloud className="h-4 w-4" />
                        {isPending ? 'Cancel Review' : 'Publish Course'}
                    </div>
                )}
            </Button>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-10 bg-amber-50">
                        <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-6 animate-bounce">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-amber-900 tracking-tight">
                                Publication Check
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-amber-800/80 font-medium text-base mt-2 leading-relaxed italic">
                                {validationError}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-white border-t border-amber-100">
                        <AlertDialogAction 
                            onClick={() => setConfirmOpen(false)}
                            className="h-12 px-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all active:scale-95"
                        >
                            Got it, I'll fix it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
