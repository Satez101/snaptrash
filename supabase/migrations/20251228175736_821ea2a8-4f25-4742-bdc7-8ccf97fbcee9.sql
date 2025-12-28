-- Create rewards tier enum
CREATE TYPE public.reward_tier AS ENUM ('digital', 'food', 'gift_card', 'impact');

-- Create rewards catalog table
CREATE TABLE public.rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    tier reward_tier NOT NULL,
    cost INTEGER NOT NULL CHECK (cost > 0),
    image_url TEXT,
    is_sold_out BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    stock_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create redemptions table to track user redemptions
CREATE TABLE public.redemptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    snapcreds_spent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Rewards policies - anyone can view active rewards
CREATE POLICY "Anyone can view active rewards"
ON public.rewards
FOR SELECT
USING (is_active = true);

-- Redemptions policies - users can only see their own redemptions
CREATE POLICY "Users can view own redemptions"
ON public.redemptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
ON public.redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to redeem a reward with validation
CREATE OR REPLACE FUNCTION public.redeem_reward(
    p_reward_id UUID,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reward RECORD;
    v_user_creds INTEGER;
    v_today_redemptions INTEGER;
    v_redemption_id UUID;
BEGIN
    -- Get reward details
    SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Reward not found or inactive');
    END IF;
    
    IF v_reward.is_sold_out THEN
        RETURN json_build_object('success', false, 'error', 'This reward is sold out');
    END IF;
    
    -- Get user's current SnapCreds
    SELECT eco_creds INTO v_user_creds FROM public.profiles WHERE user_id = p_user_id;
    
    IF v_user_creds IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User profile not found');
    END IF;
    
    IF v_user_creds < v_reward.cost THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient SnapCreds');
    END IF;
    
    -- Check daily redemption limit (1 per day)
    SELECT COUNT(*) INTO v_today_redemptions 
    FROM public.redemptions 
    WHERE user_id = p_user_id 
    AND DATE(redeemed_at) = CURRENT_DATE
    AND status != 'cancelled';
    
    IF v_today_redemptions >= 1 THEN
        RETURN json_build_object('success', false, 'error', 'Daily redemption limit reached. Try again tomorrow!');
    END IF;
    
    -- Deduct SnapCreds from user
    UPDATE public.profiles 
    SET eco_creds = eco_creds - v_reward.cost,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Create redemption record
    INSERT INTO public.redemptions (user_id, reward_id, snapcreds_spent, status)
    VALUES (p_user_id, p_reward_id, v_reward.cost, 'completed')
    RETURNING id INTO v_redemption_id;
    
    -- Update stock if applicable
    IF v_reward.stock_count IS NOT NULL THEN
        UPDATE public.rewards 
        SET stock_count = stock_count - 1,
            is_sold_out = CASE WHEN stock_count <= 1 THEN true ELSE false END,
            updated_at = now()
        WHERE id = p_reward_id;
    END IF;
    
    RETURN json_build_object(
        'success', true, 
        'redemption_id', v_redemption_id,
        'reward_name', v_reward.name,
        'spent', v_reward.cost
    );
END;
$$;

-- Insert initial rewards catalog
INSERT INTO public.rewards (name, description, tier, cost, is_sold_out) VALUES
-- Digital Certificates (Tier 1)
('Eco Warrior Certificate', 'Official SnapTrash digital certificate recognizing your environmental contributions', 'digital', 50, false),
('Carbon Footprint Hero Badge', 'Digital badge showcasing your reduced carbon footprint', 'digital', 30, false),
('Green Champion NFT', 'Exclusive digital collectible for top contributors', 'digital', 100, true),

-- Food Delivery Coupons (Tier 2)
('Swiggy ₹50 Voucher', '₹50 off on your next Swiggy order', 'food', 150, false),
('Zomato ₹100 Voucher', '₹100 off on Zomato food delivery', 'food', 250, false),
('Swiggy ₹200 Voucher', '₹200 off on Swiggy - Premium reward', 'food', 450, true),

-- Gift Cards (Tier 3)
('Amazon ₹100 Gift Card', 'Redeemable on Amazon.in for any purchase', 'gift_card', 300, false),
('Google Play ₹50 Credit', 'Credit for apps, games, and digital content', 'gift_card', 180, false),
('Amazon ₹500 Gift Card', 'Premium Amazon gift card for eco champions', 'gift_card', 1200, false),

-- Impact Rewards (Tier 4)
('Plant a Tree', 'We plant a tree in your name through our partner NGO', 'impact', 200, false),
('Leaderboard Gold Frame', 'Exclusive gold border on your leaderboard profile for 30 days', 'impact', 500, false),
('SnapTrash Ambassador Badge', 'Become an official SnapTrash Ambassador with special perks', 'impact', 1000, true);

-- Add trigger for updated_at
CREATE TRIGGER update_rewards_updated_at
BEFORE UPDATE ON public.rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();