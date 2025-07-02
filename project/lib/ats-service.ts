export interface ATSAnalysis {
  score: number;
  keywordMatches: {
    matched: string[];
    missing: string[];
    total: number;
  };
  sections: {
    contact: { present: boolean; score: number; };
    summary: { present: boolean; score: number; };
    experience: { present: boolean; score: number; };
    education: { present: boolean; score: number; };
    skills: { present: boolean; score: number; };
  };
  formatting: {
    score: number;
    issues: string[];
  };
  recommendations: string[];
  readabilityScore: number;
}

export interface JobDescriptionAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  experience: {
    minimum: number;
    preferred: number;
  };
  education: string[];
  keywords: string[];
  responsibilities: string[];
  benefits: string[];
  companyInfo: {
    name: string;
    industry: string;
    size: string;
  };
}

export class ATSService {
  // Common technical skills database
  private technicalSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker', 'Kubernetes',
    'Git', 'HTML', 'CSS', 'Angular', 'Vue.js', 'Express', 'Django', 'Spring',
    'REST API', 'GraphQL', 'Redis', 'Elasticsearch', 'Jenkins', 'CI/CD',
    'Agile', 'Scrum', 'TDD', 'Machine Learning', 'AI', 'Data Science'
  ];

  private softSkills = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Project Management', 'Time Management', 'Adaptability', 'Creativity',
    'Analytical Skills', 'Decision Making', 'Collaboration', 'Mentoring'
  ];

  analyzeJobDescription(jobDescription: string): JobDescriptionAnalysis {
    const text = jobDescription.toLowerCase();
    
    // Extract skills
    const requiredSkills = this.extractSkills(text, ['required', 'must have', 'essential']);
    const preferredSkills = this.extractSkills(text, ['preferred', 'nice to have', 'bonus']);
    
    // Extract experience requirements
    const experienceMatch = text.match(/(\d+)[\s]*(?:\+|\-)?[\s]*years?\s*(?:of\s*)?experience/g);
    const experience = {
      minimum: experienceMatch ? parseInt(experienceMatch[0]) : 0,
      preferred: experienceMatch && experienceMatch.length > 1 ? parseInt(experienceMatch[1]) : 0
    };

    // Extract education requirements
    const education = this.extractEducation(text);
    
    // Extract all keywords
    const keywords = this.extractKeywords(text);
    
    // Extract responsibilities
    const responsibilities = this.extractResponsibilities(jobDescription);
    
    // Extract benefits
    const benefits = this.extractBenefits(text);
    
    // Extract company info
    const companyInfo = this.extractCompanyInfo(jobDescription);

    return {
      requiredSkills,
      preferredSkills,
      experience,
      education,
      keywords,
      responsibilities,
      benefits,
      companyInfo
    };
  }

  analyzeResume(resumeContent: string, jobDescription?: string): ATSAnalysis {
    const resume = resumeContent.toLowerCase();
    const jobAnalysis = jobDescription ? this.analyzeJobDescription(jobDescription) : null;
    
    // Analyze keyword matches
    const keywordMatches = this.analyzeKeywordMatches(resume, jobAnalysis);
    
    // Analyze sections
    const sections = this.analyzeSections(resume);
    
    // Analyze formatting
    const formatting = this.analyzeFormatting(resumeContent);
    
    // Calculate readability
    const readabilityScore = this.calculateReadabilityScore(resumeContent);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(sections, keywordMatches, formatting);
    
    // Calculate overall score
    const score = this.calculateOverallScore(keywordMatches, sections, formatting, readabilityScore);

    return {
      score,
      keywordMatches,
      sections,
      formatting,
      recommendations,
      readabilityScore
    };
  }

  private extractSkills(text: string, indicators: string[]): string[] {
    const skills: string[] = [];
    
    // Look for technical skills
    this.technicalSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    // Look for soft skills
    this.softSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    return Array.from(new Set(skills)); // Remove duplicates
  }

  private extractEducation(text: string): string[] {
    const educationKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'associate', 'degree',
      'computer science', 'engineering', 'mathematics', 'business',
      'mba', 'bs', 'ms', 'ba', 'ma'
    ];
    
    return educationKeywords.filter(keyword => text.includes(keyword));
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in a real app, you'd use NLP
    const words = text.split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'or', 'but', 'for', 'with', 'from', 'this', 'that'].includes(word)
    );
    
    return Array.from(new Set(keywords)).slice(0, 50); // Return top 50 unique keywords
  }

  private extractResponsibilities(jobDescription: string): string[] {
    const lines = jobDescription.split('\n');
    const responsibilities: string[] = [];
    
    let inResponsibilities = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('responsibilities') || 
          trimmed.toLowerCase().includes('duties') ||
          trimmed.toLowerCase().includes('what you\'ll do')) {
        inResponsibilities = true;
        continue;
      }
      
      if (inResponsibilities && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        responsibilities.push(trimmed.substring(1).trim());
      }
      
      if (inResponsibilities && (
        trimmed.toLowerCase().includes('requirements') ||
        trimmed.toLowerCase().includes('qualifications') ||
        trimmed.toLowerCase().includes('benefits')
      )) {
        break;
      }
    }
    
    return responsibilities;
  }

  private extractBenefits(text: string): string[] {
    const benefitKeywords = [
      'health insurance', 'dental', 'vision', '401k', 'retirement',
      'vacation', 'pto', 'remote work', 'flexible schedule',
      'stock options', 'equity', 'bonus', 'gym membership'
    ];
    
    return benefitKeywords.filter(benefit => text.includes(benefit));
  }

  private extractCompanyInfo(jobDescription: string): { name: string; industry: string; size: string; } {
    // Simple extraction - in a real app, you'd use more sophisticated methods
    return {
      name: 'Company Name', // Would extract from job description
      industry: 'Technology', // Would extract from job description
      size: 'Medium (51-500)' // Would extract from job description
    };
  }

  private analyzeKeywordMatches(resume: string, jobAnalysis: JobDescriptionAnalysis | null) {
    if (!jobAnalysis) {
      return { matched: [], missing: [], total: 0 };
    }
    
    const allJobKeywords = [
      ...jobAnalysis.requiredSkills,
      ...jobAnalysis.preferredSkills,
      ...jobAnalysis.keywords.slice(0, 20) // Top 20 keywords
    ];
    
    const matched = allJobKeywords.filter(keyword => 
      resume.includes(keyword.toLowerCase())
    );
    
    const missing = allJobKeywords.filter(keyword => 
      !resume.includes(keyword.toLowerCase())
    );
    
    return {
      matched,
      missing,
      total: allJobKeywords.length
    };
  }

  private analyzeSections(resume: string) {
    return {
      contact: {
        present: this.checkContactInfo(resume),
        score: this.checkContactInfo(resume) ? 100 : 0
      },
      summary: {
        present: this.checkSummarySection(resume),
        score: this.checkSummarySection(resume) ? 100 : 50
      },
      experience: {
        present: this.checkExperienceSection(resume),
        score: this.checkExperienceSection(resume) ? 100 : 0
      },
      education: {
        present: this.checkEducationSection(resume),
        score: this.checkEducationSection(resume) ? 100 : 70
      },
      skills: {
        present: this.checkSkillsSection(resume),
        score: this.checkSkillsSection(resume) ? 100 : 60
      }
    };
  }

  private checkContactInfo(resume: string): boolean {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    
    return emailPattern.test(resume) && phonePattern.test(resume);
  }

  private checkSummarySection(resume: string): boolean {
    const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
    return summaryKeywords.some(keyword => resume.includes(keyword));
  }

  private checkExperienceSection(resume: string): boolean {
    const experienceKeywords = ['experience', 'work history', 'employment', 'career'];
    return experienceKeywords.some(keyword => resume.includes(keyword));
  }

  private checkEducationSection(resume: string): boolean {
    const educationKeywords = ['education', 'degree', 'university', 'college', 'school'];
    return educationKeywords.some(keyword => resume.includes(keyword));
  }

  private checkSkillsSection(resume: string): boolean {
    const skillsKeywords = ['skills', 'technologies', 'competencies', 'proficiencies'];
    return skillsKeywords.some(keyword => resume.includes(keyword));
  }

  private analyzeFormatting(resume: string) {
    const issues: string[] = [];
    let score = 100;
    
    // Check for excessive formatting
    if (resume.includes('<') && resume.includes('>')) {
      issues.push('Contains HTML tags - may not parse correctly in ATS');
      score -= 20;
    }
    
    // Check for special characters
    const specialChars = /[^\w\s@.-]/g;
    if (specialChars.test(resume.replace(/[.,;:!?()-]/g, ''))) {
      issues.push('Contains special characters that may cause parsing issues');
      score -= 10;
    }
    
    // Check for reasonable length
    if (resume.length < 1000) {
      issues.push('Resume appears too short - consider adding more detail');
      score -= 15;
    } else if (resume.length > 10000) {
      issues.push('Resume appears too long - consider condensing');
      score -= 10;
    }
    
    return { score: Math.max(0, score), issues };
  }

  private calculateReadabilityScore(resume: string): number {
    // Simple readability calculation
    const sentences = resume.split(/[.!?]+/).length;
    const words = resume.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Ideal range is 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) {
      return 100;
    } else if (avgWordsPerSentence < 10 || avgWordsPerSentence > 30) {
      return 60;
    } else {
      return 80;
    }
  }

  private generateRecommendations(sections: any, keywordMatches: any, formatting: any): string[] {
    const recommendations: string[] = [];
    
    if (!sections.contact.present) {
      recommendations.push('Add clear contact information (email and phone number)');
    }
    
    if (!sections.summary.present) {
      recommendations.push('Include a professional summary or objective statement');
    }
    
    if (!sections.skills.present) {
      recommendations.push('Add a dedicated skills section');
    }
    
    if (keywordMatches.matched.length < keywordMatches.total * 0.3) {
      recommendations.push('Include more relevant keywords from the job description');
    }
    
    if (formatting.issues.length > 0) {
      recommendations.push('Address formatting issues to improve ATS compatibility');
    }
    
    if (keywordMatches.missing.length > 0) {
      recommendations.push(`Consider adding these missing skills: ${keywordMatches.missing.slice(0, 5).join(', ')}`);
    }
    
    return recommendations;
  }

  private calculateOverallScore(keywordMatches: any, sections: any, formatting: any, readabilityScore: number): number {
    const keywordScore = keywordMatches.total > 0 ? (keywordMatches.matched.length / keywordMatches.total) * 100 : 80;
    const sectionScores = Object.values(sections).map((section: any) => section.score);
    const avgSectionScore = sectionScores.reduce((a: number, b: number) => a + b, 0) / sectionScores.length;
    
    // Weighted average
    const score = (
      keywordScore * 0.4 +      // 40% keyword matching
      avgSectionScore * 0.3 +   // 30% section completeness
      formatting.score * 0.2 +  // 20% formatting
      readabilityScore * 0.1    // 10% readability
    );
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
}

export const atsService = new ATSService();
