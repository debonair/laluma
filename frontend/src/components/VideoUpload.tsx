import React, { useState } from 'react';
import './VideoUpload.css';

interface VideoUploadProps {
    onVideoUploaded: (videoUrl: string, filename: string) => void;
    currentVideoUrl?: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onVideoUploaded, currentVideoUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentVideoUrl || null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Please select a valid video file');
            return;
        }

        // Validate file size (100MB)
        if (file.size > 100 * 1024 * 1024) {
            setError('Video file must be less than 100MB');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);

        try {
            setUploading(true);
            setError(null);
            setProgress(0);

            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    setProgress(Math.round(percentComplete));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    setPreviewUrl(`http://localhost:3000${data.videoUrl}`);
                    onVideoUploaded(data.videoUrl, data.filename);
                    setProgress(100);
                } else {
                    setError('Upload failed. Please try again.');
                }
                setUploading(false);
            });

            xhr.addEventListener('error', () => {
                setError('Upload failed. Please check your connection.');
                setUploading(false);
            });

            xhr.open('POST', 'http://localhost:3000/api/content/upload-video');
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
            xhr.send(formData);

        } catch (error) {
            console.error('Upload failed:', error);
            setError('Upload failed. Please try again.');
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onVideoUploaded('', '');
        setProgress(0);
    };

    return (
        <div className="video-upload">
            <label className="video-upload-label">Video Upload</label>

            {!previewUrl ? (
                <div className="upload-area">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="file-input"
                        id="video-upload-input"
                    />
                    <label htmlFor="video-upload-input" className="upload-button">
                        {uploading ? (
                            <div className="uploading-state">
                                <div className="spinner"></div>
                                <span>Uploading... {progress}%</span>
                            </div>
                        ) : (
                            <div className="upload-prompt">
                                <span className="upload-icon">📹</span>
                                <span className="upload-text">Click to upload video</span>
                                <span className="upload-hint">MP4, MOV, AVI, WEBM (max 100MB)</span>
                            </div>
                        )}
                    </label>

                    {uploading && (
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="video-preview">
                    <video controls className="preview-video">
                        <source src={previewUrl} type="video/mp4" />
                        Your browser does not support video playback.
                    </video>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="remove-button"
                    >
                        Remove Video
                    </button>
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};

export default VideoUpload;
