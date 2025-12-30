// This service will eventually connect to Firebase

export const getResources = async () => {
    // Simulate API call
    return [
        { id: 1, title: 'Visual Schedules', description: 'Customizable visual schedules to help structure daily routines.', category: 'Daily Living' },
        { id: 2, title: 'Social Stories', description: 'Narratives illustrating social norms and appropriate behaviors.', category: 'Social Skills' },
        { id: 3, title: 'Sensory Activities', description: 'Ideas for sensory-friendly activities to support regulation.', category: 'Sensory' },
    ];
};
