// src/types/contest.ts

export type MultilingualStr = { [key: string]: string };

export interface RoundDifficultyDistribution {
    low: number;
    medium: number;
    high: number;
    very_high: number;
}

export interface RoundStructure {
    round_name: string;
    round_seq: number;
    time_limit_seconds: number;
    question_count: number;
    object_count?: number;
    hints_used?: string | null;
    difficulty_distribution: RoundDifficultyDistribution;
}

export interface LevelStructure {
    level_name: string;
    level_seq: number;
    game_type: 'matching' | 'quiz';
    rounds: RoundStructure[];
}

export interface GameStructure {
    level_count: number;
    levels: LevelStructure[];
}

export interface ScoringDifficultyWeights {
    low: number;
    medium: number;
    high: number;
    very_high: number;
}

export interface ScoringParameters {
    base_points: number;
    negative_marking: number;
    time_bonus: number;
    language_weights: { [key: string]: number };
}

export interface QuizScoringParameters extends ScoringParameters {
    difficulty_weights: ScoringDifficultyWeights;
}

export interface ScoringConfig {
    matching: ScoringParameters;
    quiz: QuizScoringParameters;
    tie_breaker_rules: string[];
}

export interface EligibilityRules {
    min_age: number;
    max_age: number;
    allowed_countries: string[];
    school_required: boolean;
}

export interface VisibilityConfig {
    mode: string; // "public" | "private"
    allowed_schools: string[];
    invite_only: boolean;
}

export interface ParticipationRewards {
    certificate: boolean;
    badge?: string | null;
}

export interface RankBasedReward {
    rank_from: number;
    rank_to: number;
    reward: string;
}

export interface RewardsConfig {
    participation: ParticipationRewards;
    rank_based: RankBasedReward[];
}

export interface Contest {
    _id?: string; // Corresponds to PyObjectId alias "_id"
    name: MultilingualStr;
    description: MultilingualStr;
    status: string; // "Draft", "Published", etc.
    contest_type: string; // "Global" or "Local"
    supported_languages: string[];
    areas_of_interest?: string[];
    org_id?: string | null;
    org_code?: string | null;

    content_type?: string; // "Generic" or "Specialized"
    specialized_theme?: string | null;
    specialized_org_id?: string | null;

    registration_start_at: string; // ISO Date string
    registration_end_at: string; // ISO Date string
    contest_start_at: string; // ISO Date string
    contest_end_at: string; // ISO Date string
    grace_period_seconds: number;

    max_participants: number;
    max_incomplete_attempts: number;

    eligibility_rules: EligibilityRules;

    game_structure: GameStructure;

    scoring_config: ScoringConfig;

    visibility: VisibilityConfig;

    rewards: RewardsConfig;

    generic_theme_type?: string; // "generic" | "category" | "field_of_study"
    created_by?: string | null;
    created_at: string;
    config_locked_at?: string | null;
}

export type ContestCreate = Omit<Contest, '_id' | 'created_at' | 'created_by' | 'org_id'> & {
    org_id?: string | null;
};
