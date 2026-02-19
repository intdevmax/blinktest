export type UserRole = 'admin' | 'member';
export type TestStatus = 'active' | 'completed' | 'archived';

export interface Profile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    created_at: string;
}

export interface Test {
    id: string;
    user_id: string | null;
    creator_name: string;
    channel_tag: string;
    intended_message: string | null;
    notes: string | null;
    status: TestStatus;
    target_responses: number;
    created_at: string;
    creator?: Profile;
}

export interface TestVariant {
    id: string;
    test_id: string;
    thumbnail_url: string;
    display_order: number;
    duration_badge: string;
}

export interface Response {
    id: string;
    test_id: string;
    variant_id: string;
    user_id: string | null;
    tester_name: string;
    answer_html: string;
    clarity_rating: number;
    created_at: string;
    tester?: Profile;
}
