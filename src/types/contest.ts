// src/types/contest.ts

export type MultilingualStr = { [key: string]: string };

export interface RoundDifficultyDistribution {
    easy: number;
    medium: number;
    hard: number;
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
    easy: number;
    medium: number;
    hard: number;
}

export interface ScoringLanguageWeights {
    native: number;
    fluent: number;
    learning: number;
}

export interface TimeBonus {
    enabled: boolean;
    max_bonus: number;
}

export interface ScoringConfig {
    base_points: number;
    negative_marking: number;
    difficulty_weights: ScoringDifficultyWeights;
    language_weights: ScoringLanguageWeights;
    time_bonus: TimeBonus;
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

    eligibility_rules: EligibilityRules;

    game_structure: GameStructure;

    scoring_config: ScoringConfig;

    visibility: VisibilityConfig;

    rewards: RewardsConfig;

    created_by?: string | null;
    created_at: string;
    config_locked_at?: string | null;
}

export type ContestCreate = Omit<Contest, '_id' | 'created_at' | 'created_by' | 'org_id'> & {
    org_id?: string | null;
};
