import React from 'react';
import { LifeBuoy, Phone, ExternalLink } from 'lucide-react';

import './CrisisSignpost.css';

interface Resource {
    name: string;
    description: string;
    phone?: string;
    link?: string;
    type: 'help' | 'domestic' | 'parenting';
}

const resources: Resource[] = [
    {
        name: 'National Domestic Abuse Helpline',
        description: '24-hour freephone support for women experiencing abuse.',
        phone: '0808 2000 247',
        link: 'https://www.nationaldahelpline.org.uk/',
        type: 'domestic'
    },
    {
        name: 'Samaritans',
        description: 'Whatever you\'re going through, a Samaritan will face it with you 24/7.',
        phone: '116 123',
        link: 'https://www.samaritans.org/',
        type: 'help'
    },
    {
        name: 'Gingerbread',
        description: 'Expert advice and practical support for single parents.',
        phone: '0808 802 0925',
        link: 'https://www.gingerbread.org.uk/',
        type: 'parenting'
    },
    {
        name: 'Shout',
        description: 'Free, confidential, 24/7 text messaging support service.',
        phone: 'Text 85258',
        link: 'https://giveusashout.org/',
        type: 'help'
    }
];

const CrisisSignpost: React.FC = () => {
    return (
        <div className="crisis-signpost">
            <div className="crisis-header">
                <div className="crisis-icon-wrapper">
                    <LifeBuoy size={24} />
                </div>
                <div>
                    <h2>Need help right now?</h2>
                    <p>Confidential support and crisis resources for you.</p>
                </div>
            </div>

            <div className="crisis-list">
                {resources.map((resource, index) => (
                    <div 
                        key={index} 
                        className={`card resource-card ${resource.type}`}
                    >
                        <h3>{resource.name}</h3>
                        <p>{resource.description}</p>
                        
                        <div className="resource-actions">
                            {resource.phone && (
                                <a 
                                    href={`tel:${resource.phone.replace(/[^0-9]/g, '')}`}
                                    className="phone-action"
                                >
                                    <Phone size={16} />
                                    {resource.phone}
                                </a>
                            )}
                            {resource.link && (
                                <a 
                                    href={resource.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-action"
                                >
                                    <ExternalLink size={16} />
                                    Visit Website
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="crisis-disclaimer">
                Always call 999 (or your local emergency services) if you are in immediate danger.
            </div>
        </div>
    );
};

export default CrisisSignpost;
