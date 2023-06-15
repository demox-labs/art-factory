import React, { useState, useEffect } from 'react';

type ImageSliderProps = {
    images: string[];
    interval: number; // In milliseconds
}

export const ImageSlider: React.FC<ImageSliderProps> = ({ images, interval }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((currentImageIndex + 1) % images.length);
        }, interval);

        return () => {
            clearInterval(timer);
        };
    }, [currentImageIndex, images, interval]);

    const sliderStyle = {
        position: 'relative' as 'relative',
        height: '400px',  // Adjust as needed
        width: '400px'    // Adjust as needed
    };

    const imageStyle = (isActive: boolean) => ({
        position: 'absolute' as 'absolute',
        top: '0',
        left: '0',
        opacity: isActive ? '1' : '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover' as 'cover',
        transition: 'opacity 1s ease-in-out'
    });

    return (
        <div style={sliderStyle}>
            {images.map((img, index) => (
                <img 
                    className='rounded-md'
                    key={img}
                    src={img} 
                    alt={`slide-img-${index}`} 
                    style={imageStyle(currentImageIndex === index)}
                />
            ))}
        </div>
    );
};
