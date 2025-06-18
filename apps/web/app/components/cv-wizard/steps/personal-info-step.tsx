'use client';

import { useState } from 'react';
import { User, Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { CVData } from '@cv-generator/types';
import { Button, Input, Card, CardContent } from '@cv-generator/ui';
import { validateEmail, validatePhone } from '@cv-generator/utils';
import { StepProps } from '../types';

export function PersonalInfoStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CVData['personalInfo'], value: string) => {
    onDataChange({
      ...cvData,
      personalInfo: {
        ...cvData.personalInfo,
        [field]: value,
      },
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!cvData.personalInfo.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!cvData.personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(cvData.personalInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!cvData.personalInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(cvData.personalInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!cvData.personalInfo.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">
          Let's start with your basic contact information.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                <User className="inline w-4 h-4 mr-1" />
                Full Name *
              </label>
              <Input
                value={cvData.personalInfo.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="John Doe"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Mail className="inline w-4 h-4 mr-1" />
                Email *
              </label>
              <Input
                type="email"
                value={cvData.personalInfo.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john.doe@email.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone *
              </label>
              <Input
                type="tel"
                value={cvData.personalInfo.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location *
              </label>
              <Input
                value={cvData.personalInfo.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="New York, NY"
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && <span className="text-red-500 text-xs">{errors.location}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Linkedin className="inline w-4 h-4 mr-1" />
                LinkedIn (Optional)
              </label>
              <Input
                value={cvData.personalInfo.linkedIn || ''}
                onChange={(e) => handleChange('linkedIn', e.target.value)}
                placeholder="linkedin.com/in/johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Globe className="inline w-4 h-4 mr-1" />
                Website (Optional)
              </label>
              <Input
                value={cvData.personalInfo.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="johndoe.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {!isFirst && (
          <Button variant="outline" onClick={onPrevious}>
            Previous
          </Button>
        )}
        <Button onClick={handleNext} className="ml-auto">
          Next
        </Button>
      </div>
    </div>
  );
}