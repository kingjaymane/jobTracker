'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Brain, 
  Target, 
  Star, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  Users, 
  Zap,
  BookOpen,
  Award,
  ExternalLink,
  Heart,
  X,
  Plus
} from 'lucide-react';
import { JobApplication } from '@/app/page';
import { useToast } from '@/hooks/use-toast';

interface JobMatchingProps {
  jobs: JobApplication[];
  onAddJob: (job: Omit<JobApplication, 'id'>) => void;
}

interface UserProfile {
  skills: string[];
  experience: number;
  preferredRole: string;
  preferredLocation: string;
  salaryRange: { min: number; max: number; };
  preferredCompanySize: string;
  remoteWork: boolean;
  industries: string[];
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  matchScore: number;
  skillsMatch: number;
  experienceMatch: number;
  locationMatch: number;
  salaryMatch: number;
  companySize: string;
  remote: boolean;
  postedDate: string;
  applicationDeadline?: string;
  source: string;
  jobUrl: string;
  companyLogo?: string;
  benefits: string[];
  growthPotential: number;
  cultureFit: number;
}

export function JobMatching({ jobs, onAddJob }: JobMatchingProps) {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    experience: 3,
    preferredRole: 'Frontend Developer',
    preferredLocation: 'San Francisco, CA',
    salaryRange: { min: 80000, max: 120000 },
    preferredCompanySize: 'Medium (51-500)',
    remoteWork: true,
    industries: ['Technology', 'Fintech']
  });

  const [newSkill, setNewSkill] = useState('');
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    minMatchScore: 70,
    remote: false,
    salaryRange: [50000, 150000]
  });
  const [jobAlerts, setJobAlerts] = useState<{
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    minScore: number;
    keywords: string[];
  }>({
    enabled: false,
    frequency: 'daily',
    minScore: 80,
    keywords: []
  });
  const [interviewPrep, setInterviewPrep] = useState<{
    jobId: string;
    questions: string[];
    tips: string[];
  } | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<any>(null);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Mock job recommendations (in real app, this would come from AI/ML service)
  const mockRecommendations = useMemo(() => [
    {
      id: 'rec1',
      title: 'Senior React Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      salary: '$95,000 - $125,000',
      description: 'Join our dynamic team building next-generation web applications using React, TypeScript, and modern development practices.',
      requirements: ['React', 'TypeScript', 'Node.js', '3+ years experience'],
      matchScore: 92,
      skillsMatch: 95,
      experienceMatch: 90,
      locationMatch: 100,
      salaryMatch: 85,
      companySize: 'Medium (51-500)',
      remote: true,
      postedDate: '2024-01-20',
      applicationDeadline: '2024-02-15',
      source: 'LinkedIn',
      jobUrl: 'https://example.com/job1',
      benefits: ['Health Insurance', 'Remote Work', '401k', 'Stock Options'],
      growthPotential: 85,
      cultureFit: 88
    },
    {
      id: 'rec2',
      title: 'Frontend Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      salary: '$85,000 - $110,000',
      description: 'Build innovative user interfaces for our cutting-edge SaaS platform. Work with React, Next.js, and modern styling frameworks.',
      requirements: ['React', 'Next.js', 'CSS', '2+ years experience'],
      matchScore: 88,
      skillsMatch: 92,
      experienceMatch: 85,
      locationMatch: 95,
      salaryMatch: 80,
      companySize: 'Startup (1-50)',
      remote: true,
      postedDate: '2024-01-18',
      source: 'AngelList',
      jobUrl: 'https://example.com/job2',
      benefits: ['Flexible Hours', 'Remote Work', 'Learning Budget'],
      growthPotential: 95,
      cultureFit: 82
    },
    {
      id: 'rec3',
      title: 'Full Stack Developer',
      company: 'Enterprise Corp',
      location: 'New York, NY',
      salary: '$100,000 - $130,000',
      description: 'Work on large-scale enterprise applications using modern web technologies. Experience with both frontend and backend development.',
      requirements: ['JavaScript', 'React', 'Node.js', 'SQL', '4+ years experience'],
      matchScore: 78,
      skillsMatch: 85,
      experienceMatch: 70,
      locationMatch: 60,
      salaryMatch: 90,
      companySize: 'Large (500+)',
      remote: false,
      postedDate: '2024-01-15',
      source: 'Indeed',
      jobUrl: 'https://example.com/job3',
      benefits: ['Health Insurance', 'Dental', 'Vision', '401k', 'Paid Time Off'],
      growthPotential: 75,
      cultureFit: 70
    }
  ], []);

  const mockResumes = [
    {
      id: 'resume1',
      name: 'John Doe - Frontend Developer',
      type: 'LinkedIn Profile',
      skills: ['JavaScript', 'React', 'CSS', 'HTML', 'Node.js'],
      experience: 4,
      education: 'Bachelor of Science in Computer Science',
      location: 'San Francisco, CA',
      remote: true,
      summary: 'Passionate frontend developer with 4 years of experience in building responsive and accessible web applications.',
      atsScore: 85,
      createdAt: '2024-01-10'
    },
    {
      id: 'resume2',
      name: 'Jane Smith - Full Stack Developer',
      type: 'Uploaded Resume',
      skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
      experience: 5,
      education: 'Bachelor of Science in Software Engineering',
      location: 'New York, NY',
      remote: false,
      summary: 'Full stack developer with a strong background in building scalable web applications and RESTful APIs.',
      atsScore: 90,
      createdAt: '2024-01-12'
    },
    {
      id: 'resume3',
      name: 'Emily Johnson - UI/UX Designer',
      type: 'LinkedIn Profile',
      skills: ['Figma', 'Sketch', 'Adobe XD', 'InVision', 'HTML', 'CSS'],
      experience: 3,
      education: 'Bachelor of Fine Arts in Graphic Design',
      location: 'Remote',
      remote: true,
      summary: 'Creative UI/UX designer with 3 years of experience in designing user-centered interfaces and experiences for web and mobile applications.',
      atsScore: 88,
      createdAt: '2024-01-15'
    }
  ];

  useEffect(() => {
    // Simulate AI job matching
    setLoading(true);
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setLoading(false);
    }, 1500);
  }, [userProfile, mockRecommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(job => {
      if (job.matchScore < selectedFilters.minMatchScore) return false;
      if (selectedFilters.remote && !job.remote) return false;
      
      const salary = parseInt(job.salary.replace(/[^0-9]/g, ''));
      if (salary < selectedFilters.salaryRange[0] || salary > selectedFilters.salaryRange[1]) return false;
      
      return true;
    });
  }, [recommendations, selectedFilters]);

  const addSkill = () => {
    if (newSkill.trim() && !userProfile.skills.includes(newSkill.trim())) {
      setUserProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setUserProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const toggleSavedJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const applyToJob = (job: JobRecommendation) => {
    onAddJob({
      companyName: job.company,
      jobTitle: job.title,
      jobLink: job.jobUrl,
      status: 'applied',
      dateApplied: new Date().toISOString().split('T')[0],
      notes: `Applied through JobTracker AI matching (${job.matchScore}% match)`
    });
    
    toast({
      title: "Application Tracked",
      description: `Added ${job.title} at ${job.company} to your job applications.`,
    });
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700 font-semibold';
    if (score >= 80) return 'text-blue-700 font-semibold';
    if (score >= 70) return 'text-orange-700 font-semibold';
    return 'text-red-700 font-semibold';
  };

  const generateInterviewPrep = (job: JobRecommendation) => {
    const questions = [
      `Tell me about your experience with ${job.requirements[0] || 'relevant technologies'}.`,
      `Why are you interested in working at ${job.company}?`,
      `How would you handle a challenging project deadline?`,
      `Describe a time when you had to learn a new technology quickly.`,
      `What interests you most about this ${job.title} role?`
    ];

    const tips = [
      `Research ${job.company}'s recent projects and company culture`,
      `Prepare specific examples demonstrating ${job.requirements.slice(0, 2).join(' and ')} skills`,
      `Practice explaining your experience with remote work (this role is ${job.remote ? 'remote' : 'on-site'})`,
      `Prepare questions about the team structure and growth opportunities`,
      `Review the job requirements and align your experience with each point`
    ];

    setInterviewPrep({ jobId: job.id, questions, tips });
  };

  const saveJobAlert = () => {
    toast({
      title: "Job Alert Saved",
      description: `You'll receive ${jobAlerts.frequency} notifications for jobs with ${jobAlerts.minScore}%+ match.`,
    });
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 90) return 'badge-gradient-green border';
    if (score >= 80) return 'badge-gradient-blue border';
    if (score >= 70) return 'badge-gradient-orange border';
    return 'badge-gradient-red border';
  };

  const analyzeJobDescription = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Mock analysis results
      setJobAnalysis({
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        preferredSkills: ['TypeScript', 'CSS', 'HTML'],
        experience: { minimum: 3, preferred: 5 },
        location: 'San Francisco, CA',
        remote: true
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const toggleResumeSelection = (resumeId: string) => {
    setSelectedResumes(prev => 
      prev.includes(resumeId) 
        ? prev.filter(id => id !== resumeId)
        : [...prev, resumeId]
    );
  };

  const compareResumes = () => {
    setIsComparing(true);
    setTimeout(() => {
      // Mock comparison results
      setComparisonResults([
        {
          resume: mockResumes[0],
          atsAnalysis: {
            score: 85,
            keywordMatches: {
              matched: ['JavaScript', 'React', 'Node.js'],
              missing: ['TypeScript', 'CSS'],
              total: 5
            },
            readabilityScore: 90,
            formatting: { score: 95 }
          }
        },
        {
          resume: mockResumes[1],
          atsAnalysis: {
            score: 90,
            keywordMatches: {
              matched: ['JavaScript', 'React', 'Node.js', 'Express'],
              missing: ['TypeScript'],
              total: 5
            },
            readabilityScore: 85,
            formatting: { score: 90 }
          }
        },
        {
          resume: mockResumes[2],
          atsAnalysis: {
            score: 88,
            keywordMatches: {
              matched: ['JavaScript', 'React', 'Node.js'],
              missing: ['TypeScript', 'CSS', 'HTML'],
              total: 6
            },
            readabilityScore: 92,
            formatting: { score: 93 }
          }
        }
      ]);
      setIsComparing(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Job Matching
          </h1>
          <p className="text-muted-foreground">
            Discover personalized job recommendations powered by AI
          </p>
        </div>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">Recommendations</TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Profile Setup</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">Job Alerts</TabsTrigger>
          <TabsTrigger value="interview-prep" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Interview Prep</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">Market Insights</TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Saved Jobs</TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">Resume Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Minimum Match Score</Label>
                  <Slider
                    value={[selectedFilters.minMatchScore]}
                    onValueChange={([value]) => setSelectedFilters(prev => ({ ...prev, minMatchScore: value }))}
                    max={100}
                    min={50}
                    step={5}
                    className="mt-2 [&_.slider-range]:slider-gradient-purple [&_.slider-thumb]:border-purple-500 [&_.slider-thumb]:bg-white"
                  />
                  <p className="text-sm text-muted-foreground mt-1">{selectedFilters.minMatchScore}%</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remote-only"
                    checked={selectedFilters.remote}
                    onCheckedChange={(checked) => setSelectedFilters(prev => ({ ...prev, remote: checked }))}
                  />
                  <Label htmlFor="remote-only">Remote Only</Label>
                </div>
                <div>
                  <Label>Salary Range</Label>
                  <Slider
                    value={selectedFilters.salaryRange}
                    onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, salaryRange: value }))}
                    max={200000}
                    min={30000}
                    step={5000}
                    className="mt-2 [&_.slider-range]:slider-gradient-green [&_.slider-thumb]:border-green-500 [&_.slider-thumb]:bg-white"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    ${selectedFilters.salaryRange[0].toLocaleString()} - ${selectedFilters.salaryRange[1].toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Recommendations */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {filteredRecommendations.length} Job Recommendations
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRecommendations.map((job) => (
                  <Card key={job.id} className="card-gradient-matching hover:shadow-lg transition-all duration-300 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            <Badge className={getMatchScoreBg(job.matchScore)}>
                              {job.matchScore}% match
                            </Badge>
                            {job.remote && <Badge variant="secondary">Remote</Badge>}
                          </div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company} • {job.location}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSavedJob(job.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${savedJobs.includes(job.id) ? 'fill-red-500 text-red-500' : ''}`}
                          />
                        </Button>
                      </div>

                      <p className="text-sm mb-4">{job.description}</p>

                      {/* Match Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label className="text-xs text-blue-700">Skills Match</Label>
                          <div className="mt-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full progress-gradient-blue transition-all duration-300" 
                              style={{width: `${job.skillsMatch}%`}}
                            />
                          </div>
                          <span className="text-xs text-blue-600">{job.skillsMatch}%</span>
                        </div>
                        <div>
                          <Label className="text-xs text-green-700">Experience</Label>
                          <div className="mt-1 h-2 bg-green-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full progress-gradient-green transition-all duration-300" 
                              style={{width: `${job.experienceMatch}%`}}
                            />
                          </div>
                          <span className="text-xs text-green-600">{job.experienceMatch}%</span>
                        </div>
                        <div>
                          <Label className="text-xs text-purple-700">Location</Label>
                          <div className="mt-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full progress-gradient-purple transition-all duration-300" 
                              style={{width: `${job.locationMatch}%`}}
                            />
                          </div>
                          <span className="text-xs text-purple-600">{job.locationMatch}%</span>
                        </div>
                        <div>
                          <Label className="text-xs text-orange-700">Culture Fit</Label>
                          <div className="mt-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full progress-gradient-orange transition-all duration-300" 
                              style={{width: `${job.cultureFit}%`}}
                            />
                          </div>
                          <span className="text-xs text-orange-600">{job.cultureFit}%</span>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="mb-4">
                        <Label className="text-xs font-medium">Key Requirements</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.requirements.map((req, index) => (
                            <Badge key={index} variant="outline" className={`text-xs ${
                              index % 4 === 0 ? 'badge-gradient-blue' :
                              index % 4 === 1 ? 'badge-gradient-green' :
                              index % 4 === 2 ? 'badge-gradient-purple' :
                              'badge-gradient-orange'
                            }`}>
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="mb-4">
                        <Label className="text-xs font-medium">Benefits</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.benefits.map((benefit, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => applyToJob(job)} className="btn-gradient-primary">
                            Apply & Track
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => generateInterviewPrep(job)} className="border-green-300 text-green-700 hover:bg-green-50">
                            <BookOpen className="h-4 w-4 mr-1" />
                            Prep Interview
                          </Button>
                          <Button variant="outline" asChild className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            <a href={job.jobUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Job
                            </a>
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Posted {new Date(job.postedDate).toLocaleDateString()} via {job.source}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Alert Settings</CardTitle>
              <CardDescription>Get notified when new jobs match your criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-alerts"
                  checked={jobAlerts.enabled}
                  onCheckedChange={(checked) => setJobAlerts(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enable-alerts">Enable Job Alerts</Label>
              </div>
              
              {jobAlerts.enabled && (
                <>
                  <div>
                    <Label>Alert Frequency</Label>
                    <Select 
                      value={jobAlerts.frequency} 
                      onValueChange={(value: 'daily' | 'weekly') => setJobAlerts(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Minimum Match Score</Label>
                    <Slider
                      value={[jobAlerts.minScore]}
                      onValueChange={([value]) => setJobAlerts(prev => ({ ...prev, minScore: value }))}
                      max={100}
                      min={50}
                      step={5}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">{jobAlerts.minScore}%</p>
                  </div>
                  
                  <div>
                    <Label>Alert Keywords</Label>
                    <Input
                      placeholder="e.g., React, Senior, Remote"
                      value={jobAlerts.keywords.join(', ')}
                      onChange={(e) => setJobAlerts(prev => ({ 
                        ...prev, 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) 
                      }))}
                    />
                  </div>
                  
                  <Button onClick={saveJobAlert} className="w-full btn-gradient-secondary">
                    Save Alert Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview-prep" className="space-y-6">
          {interviewPrep ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Preparation</CardTitle>
                  <CardDescription>
                    Customized prep materials for your selected job
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Common Interview Questions</h4>
                    <div className="space-y-2">
                      {interviewPrep.questions.map((question, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Preparation Tips</h4>
                    <div className="space-y-2">
                      {interviewPrep.tips.map((tip, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setInterviewPrep(null)}
                    className="w-full"
                  >
                    Back to Jobs
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Interview Preparation</CardTitle>
                <CardDescription>
                  Select a job from the recommendations to generate customized interview prep materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Click &quot;Prep Interview&quot; on any job recommendation to get started
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Update your profile to get better job recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Preferred Role</Label>
                  <Input
                    value={userProfile.preferredRole}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, preferredRole: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Years of Experience</Label>
                  <Slider
                    value={[userProfile.experience]}
                    onValueChange={([value]) => setUserProfile(prev => ({ ...prev, experience: value }))}
                    max={20}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">{userProfile.experience} years</p>
                </div>
              </div>

              <div>
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {userProfile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Preferred Location</Label>
                  <Input
                    value={userProfile.preferredLocation}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, preferredLocation: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Company Size Preference</Label>
                  <Select
                    value={userProfile.preferredCompanySize}
                    onValueChange={(value) => setUserProfile(prev => ({ ...prev, preferredCompanySize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Startup (1-50)">Startup (1-50)</SelectItem>
                      <SelectItem value="Medium (51-500)">Medium (51-500)</SelectItem>
                      <SelectItem value="Large (500+)">Large (500+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Salary Range</Label>
                <Slider
                  value={[userProfile.salaryRange.min, userProfile.salaryRange.max]}
                  onValueChange={([min, max]) => setUserProfile(prev => ({ 
                    ...prev, 
                    salaryRange: { min, max } 
                  }))}
                  max={200000}
                  min={30000}
                  step={5000}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  ${userProfile.salaryRange.min.toLocaleString()} - ${userProfile.salaryRange.max.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="remote-work"
                  checked={userProfile.remoteWork}
                  onCheckedChange={(checked) => setUserProfile(prev => ({ ...prev, remoteWork: checked }))}
                />
                <Label htmlFor="remote-work">Open to Remote Work</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>Insights about your target role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Demand for {userProfile.preferredRole}</span>
                  <Badge className="bg-green-100 text-green-800">High</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Salary</span>
                  <span className="font-medium">$95,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remote Opportunities</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Competition Level</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Gap Analysis</CardTitle>
                <CardDescription>Skills to improve your marketability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">AWS/Cloud</span>
                    <span className="text-sm text-green-600">+15% match</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">GraphQL</span>
                    <span className="text-sm text-green-600">+12% match</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Docker</span>
                    <span className="text-sm text-green-600">+10% match</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <Button className="w-full mt-4">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Get Learning Resources
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Jobs ({savedJobs.length})</CardTitle>
              <CardDescription>Jobs you&apos;ve saved for later review</CardDescription>
            </CardHeader>
            <CardContent>
              {savedJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No saved jobs yet. Heart jobs from the recommendations to save them here.
                </p>
              ) : (
                <div className="space-y-4">
                  {recommendations
                    .filter(job => savedJobs.includes(job.id))
                    .map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                          <Badge className={getMatchScoreBg(job.matchScore)}>
                            {job.matchScore}% match
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => applyToJob(job)}>
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleSavedJob(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="card-gradient-matching border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-700">Resume-Job Comparison</CardTitle>
              <CardDescription>
                Compare your resumes against a job description to find the best match
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Description Input */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-purple-700">Job Description</Label>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[300px] border-purple-200 focus:border-purple-400"
                  />
                  <Button 
                    onClick={analyzeJobDescription} 
                    disabled={!jobDescription.trim() || isAnalyzing}
                    className="w-full btn-gradient-info"
                  >
                    {isAnalyzing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Job Description
                      </>
                    )}
                  </Button>
                </div>

                {/* Resume Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-green-700">Available Resumes</Label>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {mockResumes.map((resume) => (
                      <Card key={resume.id} className={`cursor-pointer transition-all duration-200 ${
                        selectedResumes.includes(resume.id) 
                          ? 'ring-2 ring-green-500 bg-green-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleResumeSelection(resume.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{resume.name}</h4>
                              <p className="text-sm text-muted-foreground">{resume.type}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resume.skills.slice(0, 3).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="badge-gradient-blue text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {resume.skills.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{resume.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {selectedResumes.includes(resume.id) && (
                                <div className="text-green-600 font-semibold">Selected</div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Button 
                    onClick={compareResumes} 
                    disabled={selectedResumes.length === 0 || !jobAnalysis || isComparing}
                    className="w-full btn-gradient-success"
                  >
                    {isComparing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Comparing...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Compare Selected Resumes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Job Analysis Results */}
              {jobAnalysis && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-blue-700">Job Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {jobAnalysis.requiredSkills.slice(0, 5).map((skill: string) => (
                            <Badge key={skill} className="badge-gradient-red">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Preferred Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {jobAnalysis.preferredSkills.slice(0, 5).map((skill: string) => (
                            <Badge key={skill} className="badge-gradient-orange">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Experience Required</h4>
                        <p className="text-sm">{jobAnalysis.experience.minimum}+ years</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparison Results */}
              {comparisonResults.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-700">Comparison Results</CardTitle>
                    <CardDescription>
                      Here are your resumes ranked by their match with the job description
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparisonResults
                        .sort((a, b) => b.atsAnalysis.score - a.atsAnalysis.score)
                        .map((result, index) => (
                        <Card key={result.resume.id} className={`${
                          index === 0 ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-lg">{result.resume.name}</h4>
                                {index === 0 && (
                                  <Badge className="badge-gradient-green mt-1">
                                    🏆 Best Match
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-700">
                                  {result.atsAnalysis.score}%
                                </div>
                                <div className="text-sm text-muted-foreground">ATS Score</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <Label className="text-xs text-green-700">Keyword Match</Label>
                                <div className="mt-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>{result.atsAnalysis.keywordMatches.matched.length} / {result.atsAnalysis.keywordMatches.total}</span>
                                    <span>{Math.round((result.atsAnalysis.keywordMatches.matched.length / result.atsAnalysis.keywordMatches.total) * 100)}%</span>
                                  </div>
                                  <div className="h-2 bg-green-100 rounded-full overflow-hidden mt-1">
                                    <div 
                                      className="h-full progress-gradient-green transition-all duration-300" 
                                      style={{width: `${(result.atsAnalysis.keywordMatches.matched.length / result.atsAnalysis.keywordMatches.total) * 100}%`}}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-blue-700">Skills Match</Label>
                                <div className="mt-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>{result.atsAnalysis.skillsMatches.matched.length} / {result.atsAnalysis.skillsMatches.total}</span>
                                    <span>{Math.round((result.atsAnalysis.skillsMatches.matched.length / result.atsAnalysis.skillsMatches.total) * 100)}%</span>
                                  </div>
                                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden mt-1">
                                    <div 
                                      className="h-full progress-gradient-blue transition-all duration-300" 
                                      style={{width: `${(result.atsAnalysis.skillsMatches.matched.length / result.atsAnalysis.skillsMatches.total) * 100}%`}}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-purple-700">Experience Match</Label>
                                <div className="mt-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>{result.atsAnalysis.experienceMatch}%</span>
                                  </div>
                                  <div className="h-2 bg-purple-100 rounded-full overflow-hidden mt-1">
                                    <div 
                                      className="h-full progress-gradient-purple transition-all duration-300" 
                                      style={{width: `${result.atsAnalysis.experienceMatch}%`}}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <Label className="text-xs text-muted-foreground mb-2 block">Key Strengths</Label>
                              <div className="flex flex-wrap gap-2">
                                {result.atsAnalysis.keywordMatches.matched.slice(0, 6).map((keyword: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="badge-gradient-green text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {result.atsAnalysis.recommendations.length > 0 && (
                              <div className="mt-4">
                                <Label className="text-xs text-muted-foreground mb-2 block">Improvement Areas</Label>
                                <div className="space-y-1">
                                  {result.atsAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                                    <div key={idx} className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
                                      {rec}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
