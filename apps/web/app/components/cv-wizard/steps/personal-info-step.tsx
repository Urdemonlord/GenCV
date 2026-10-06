'use client';

import { useState } from 'react';
import { User, Briefcase, Mail, Phone, MapPin, Linkedin, Globe, Plus, X } from 'lucide-react';
import { CVData, Skill } from '@cv-generator/types';
import { Button, Input, Card, CardContent, Badge } from '@cv-generator/ui';
import { validateEmail, validatePhone, generateId } from '@cv-generator/utils';
import { StepProps } from '../types';

export function PersonalInfoStep({ cvData, onDataChange, onNext, onPrevious, isFirst }: StepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState('');

  // Popular skills for quick selection
  const popularSkills = [
    'JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'Java',
    'HTML/CSS', 'MongoDB', 'SQL', 'Git', 'Docker', 'AWS',
    'Communication', 'Team Leadership', 'Problem Solving', 'Project Management'
  ];

  const handleChange = (field: keyof CVData['personalInfo'], value: string) => {
    onDataChange((previous) => ({
      ...previous,
      personalInfo: {
        ...previous.personalInfo,
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));    }
  };

  const addSkill = (skillName: string) => {
    if (!skillName.trim() || cvData.skills.some(skill => skill.name.toLowerCase() === skillName.toLowerCase())) {
      return;
    }

    const skill: Skill = {
      id: generateId(),
      name: skillName.trim(),
      level: 'Intermediate',
      category: 'Technical',
    };

    onDataChange((previous) => ({
      ...previous,
      skills: [...previous.skills, skill],
    }));
  };

  const addCustomSkill = () => {
    if (newSkill.trim()) {
      addSkill(newSkill);
      setNewSkill('');
    }
  };

  const removeSkill = (skillId: string) => {
    onDataChange((previous) => ({
      ...previous,
      skills: previous.skills.filter((skill) => skill.id !== skillId),
    }));
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
      newErrors.phone = 'Please enter a valid phone number, e.g. +62 812 3456 7890';
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
          Let&apos;s start with your basic contact information.
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
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && <span className="text-destructive text-xs">{errors.fullName}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Briefcase className="inline w-4 h-4 mr-1" />
                Professional Title (Optional)
              </label>
              <Input
                value={cvData.personalInfo.headline || ''}
                onChange={(e) => handleChange('headline', e.target.value)}
                placeholder="e.g. Data Analyst"
              />
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
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <span className="text-destructive text-xs">{errors.email}</span>}
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
                placeholder="+62 812 3456 7890"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone ? (
                <span className="text-destructive text-xs">{errors.phone}</span>
              ) : (
                cvData.personalInfo.phone.trim() &&
                !cvData.personalInfo.phone.trim().startsWith('+') && (
                  <span className="text-warning text-xs">
                    Tip: add your country code (e.g. +62) so international recruiters can reach you.
                  </span>
                )
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location *
              </label>
              <Input
                value={cvData.personalInfo.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="City, Country"
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && <span className="text-destructive text-xs">{errors.location}</span>}
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
          </div>        </CardContent>
      </Card>

      {/* Quick Skills Addition */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Quick Skills Setup (Optional)</h3>
            <Badge variant="secondary">{cvData.skills.length} skills added</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Add a few key skills to get better AI-generated content later. You can always add more in the Skills step.
          </p>

          {/* Popular Skills */}
          <div>
            <label className="block text-sm font-medium mb-2">Popular Skills (Click to add):</label>
            <div className="flex flex-wrap gap-2">
              {popularSkills
                .filter(skill => !cvData.skills.some(s => s.name.toLowerCase() === skill.toLowerCase()))
                .slice(0, 8)
                .map((skill) => (
                <Button
                  key={skill}
                  variant="outline"
                  size="sm"
                  onClick={() => addSkill(skill)}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {skill}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Skill Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Add Custom Skill:</label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter a skill..."
                onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                className="flex-1"
              />
              <Button onClick={addCustomSkill} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Added Skills */}
          {cvData.skills.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Your Skills:</label>
              <div className="flex flex-wrap gap-2">
                {cvData.skills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="default"
                    className="flex items-center gap-1"
                  >
                    {skill.name}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeSkill(skill.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-primary/10  p-3 rounded text-sm">
            <p className="text-foreground/90 ">
              💡 <strong>Tip:</strong> Adding skills here will help generate better AI-powered content in the Professional Summary and Experience sections.
            </p>
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