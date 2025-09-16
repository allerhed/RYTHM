--
-- PostgreSQL database dump
--

\restrict vLZT3QWkpF2NmWcmlHFqHqnPVB1k3AiigOtOitYoL4GHwDloLXoVGiZDzo6OFtY

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: exercise_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.exercise_type AS ENUM (
    'STRENGTH',
    'CARDIO'
);


--
-- Name: session_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_category AS ENUM (
    'strength',
    'cardio',
    'hybrid'
);


--
-- Name: set_value_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.set_value_type AS ENUM (
    'weight_kg',
    'distance_m',
    'duration_s',
    'calories',
    'reps'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'athlete',
    'coach',
    'tenant_admin',
    'org_admin',
    'system_admin'
);


--
-- Name: calculate_one_rm(numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_one_rm(weight numeric, reps integer) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    IF reps = 1 THEN
        RETURN weight;
    END IF;
    
    -- Epley formula: 1RM = weight * (1 + reps/30)
    RETURN weight * (1 + reps::NUMERIC / 30);
END;
$$;


--
-- Name: current_tenant_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_tenant_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- In production, this would extract tenant_id from JWT claims
    -- For now, we use a session variable that the API sets
    RETURN COALESCE(
        current_setting('rythm.current_tenant_id', true)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$;


--
-- Name: is_org_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_org_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN COALESCE(
        current_setting('rythm.is_org_admin', true)::BOOLEAN,
        false
    );
END;
$$;


--
-- Name: refresh_analytics_views(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_analytics_views() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY training_volume_weekly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY muscle_group_volume;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercises (
    exercise_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    muscle_groups text[] DEFAULT '{}'::text[] NOT NULL,
    equipment text,
    media jsonb DEFAULT '{}'::jsonb,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    default_value_1_type public.set_value_type,
    default_value_2_type public.set_value_type,
    exercise_category text DEFAULT 'strength'::text,
    is_active boolean DEFAULT true,
    exercise_type public.exercise_type,
    CONSTRAINT exercises_exercise_category_check CHECK ((exercise_category = ANY (ARRAY['strength'::text, 'cardio'::text, 'flexibility'::text, 'sports'::text]))),
    CONSTRAINT exercises_name_check CHECK (((length(name) > 0) AND (length(name) <= 255)))
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    session_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    program_id uuid,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    category public.session_category NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    training_load integer,
    perceived_exertion numeric(3,1),
    name text,
    duration_seconds integer DEFAULT 3600,
    CONSTRAINT sessions_duration_seconds_check CHECK ((duration_seconds > 0)),
    CONSTRAINT sessions_perceived_exertion_check CHECK (((perceived_exertion >= 1.0) AND (perceived_exertion <= 10.0))),
    CONSTRAINT sessions_training_load_check CHECK ((training_load >= 0))
);


--
-- Name: COLUMN sessions.training_load; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sessions.training_load IS 'Subjective training load value entered by user';


--
-- Name: COLUMN sessions.perceived_exertion; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sessions.perceived_exertion IS 'Perceived exertion rating from 1.0 to 10.0 (RPE scale)';


--
-- Name: COLUMN sessions.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sessions.name IS 'Custom name for the workout session (e.g., "Push Day", "Morning Run")';


--
-- Name: COLUMN sessions.duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sessions.duration_seconds IS 'Workout duration in seconds as entered by the user (default 1 hour = 3600 seconds)';


--
-- Name: sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sets (
    set_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    session_id uuid NOT NULL,
    exercise_id uuid NOT NULL,
    set_index integer NOT NULL,
    reps integer,
    value_1_type public.set_value_type,
    value_1_numeric numeric(10,3),
    value_2_type public.set_value_type,
    value_2_numeric numeric(10,3),
    rpe numeric(3,1),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sets_check CHECK ((((value_1_type IS NULL) OR (value_1_numeric IS NOT NULL)) AND ((value_2_type IS NULL) OR (value_2_numeric IS NOT NULL)))),
    CONSTRAINT sets_reps_check CHECK ((reps > 0)),
    CONSTRAINT sets_rpe_check CHECK (((rpe >= (1)::numeric) AND (rpe <= (10)::numeric))),
    CONSTRAINT sets_set_index_check CHECK ((set_index > 0)),
    CONSTRAINT sets_value_1_numeric_check CHECK ((value_1_numeric >= (0)::numeric)),
    CONSTRAINT sets_value_2_numeric_check CHECK ((value_2_numeric >= (0)::numeric))
);


--
-- Name: exercise_pr_tracking; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.exercise_pr_tracking AS
 SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id) s.tenant_id,
    s.user_id,
    st.exercise_id,
    e.name AS exercise_name,
    e.exercise_category,
    e.exercise_type,
    s.started_at AS pr_date,
    st.value_1_numeric AS weight_kg,
    st.value_2_numeric AS reps,
    (((st.value_1_numeric * st.value_2_numeric) * 0.033) + st.value_1_numeric) AS estimated_1rm
   FROM ((public.sessions s
     JOIN public.sets st ON ((st.session_id = s.session_id)))
     JOIN public.exercises e ON ((e.exercise_id = st.exercise_id)))
  WHERE ((s.completed_at IS NOT NULL) AND (st.value_1_type = 'weight_kg'::public.set_value_type) AND (st.value_2_type = 'reps'::public.set_value_type) AND (st.value_1_numeric > (0)::numeric) AND (st.value_2_numeric > (0)::numeric))
  ORDER BY s.tenant_id, s.user_id, st.exercise_id, (((st.value_1_numeric * st.value_2_numeric) * 0.033) + st.value_1_numeric) DESC NULLS LAST, s.started_at DESC;


--
-- Name: exercise_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exercise_templates (
    template_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    muscle_groups text[] DEFAULT '{}'::text[] NOT NULL,
    equipment text,
    exercise_category text DEFAULT 'strength'::text,
    default_value_1_type public.set_value_type,
    default_value_2_type public.set_value_type,
    description text,
    instructions text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    exercise_type public.exercise_type NOT NULL,
    CONSTRAINT exercise_templates_exercise_category_check CHECK ((exercise_category = ANY (ARRAY['strength'::text, 'cardio'::text, 'flexibility'::text, 'sports'::text]))),
    CONSTRAINT exercise_templates_name_check CHECK (((length(name) > 0) AND (length(name) <= 255)))
);


--
-- Name: exercise_volume_tracking; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.exercise_volume_tracking AS
 SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id) s.tenant_id,
    s.user_id,
    st.exercise_id,
    e.name AS exercise_name,
    e.exercise_category,
    e.exercise_type,
    s.started_at AS session_date,
    count(st.set_id) AS total_sets,
    sum((st.value_1_numeric * st.value_2_numeric)) AS total_volume_kg_reps,
    avg(st.value_1_numeric) AS avg_weight_kg,
    avg(st.value_2_numeric) AS avg_reps
   FROM ((public.sessions s
     JOIN public.sets st ON ((st.session_id = s.session_id)))
     JOIN public.exercises e ON ((e.exercise_id = st.exercise_id)))
  WHERE ((s.completed_at IS NOT NULL) AND (st.value_1_type = 'weight_kg'::public.set_value_type) AND (st.value_2_type = 'reps'::public.set_value_type) AND (st.value_1_numeric > (0)::numeric) AND (st.value_2_numeric > (0)::numeric))
  GROUP BY s.tenant_id, s.user_id, st.exercise_id, e.name, e.exercise_category, e.exercise_type, s.started_at
  ORDER BY s.tenant_id, s.user_id, st.exercise_id, (sum((st.value_1_numeric * st.value_2_numeric))) DESC NULLS LAST, s.started_at DESC;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    filename text NOT NULL,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: muscle_group_volume; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.muscle_group_volume AS
 SELECT s.tenant_id,
    s.user_id,
    s.category,
    unnest(e.muscle_groups) AS muscle_group,
    date_trunc('month'::text, s.started_at) AS month_start,
    count(st.set_id) AS sets_count,
    COALESCE(sum(
        CASE
            WHEN ((st.value_1_type = 'weight_kg'::public.set_value_type) AND (st.reps IS NOT NULL)) THEN (st.value_1_numeric * (st.reps)::numeric)
            WHEN ((st.value_2_type = 'weight_kg'::public.set_value_type) AND (st.reps IS NOT NULL)) THEN (st.value_2_numeric * (st.reps)::numeric)
            ELSE (0)::numeric
        END), (0)::numeric) AS volume
   FROM ((public.sessions s
     JOIN public.sets st ON ((s.session_id = st.session_id)))
     JOIN public.exercises e ON ((st.exercise_id = e.exercise_id)))
  WHERE (s.completed_at IS NOT NULL)
  GROUP BY s.tenant_id, s.user_id, s.category, (unnest(e.muscle_groups)), (date_trunc('month'::text, s.started_at))
  WITH NO DATA;


--
-- Name: personal_records; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.personal_records AS
 WITH weight_prs AS (
         SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id) s.tenant_id,
            s.user_id,
            st.exercise_id,
            e.name AS exercise_name,
            'weight'::text AS pr_type,
            GREATEST(
                CASE
                    WHEN (st.value_1_type = 'weight_kg'::public.set_value_type) THEN st.value_1_numeric
                    ELSE (0)::numeric
                END,
                CASE
                    WHEN (st.value_2_type = 'weight_kg'::public.set_value_type) THEN st.value_2_numeric
                    ELSE (0)::numeric
                END) AS value,
            s.started_at AS achieved_at
           FROM ((public.sessions s
             JOIN public.sets st ON ((s.session_id = st.session_id)))
             JOIN public.exercises e ON ((st.exercise_id = e.exercise_id)))
          WHERE (((st.value_1_type = 'weight_kg'::public.set_value_type) OR (st.value_2_type = 'weight_kg'::public.set_value_type)) AND (s.completed_at IS NOT NULL))
          ORDER BY s.tenant_id, s.user_id, st.exercise_id, GREATEST(
                CASE
                    WHEN (st.value_1_type = 'weight_kg'::public.set_value_type) THEN st.value_1_numeric
                    ELSE (0)::numeric
                END,
                CASE
                    WHEN (st.value_2_type = 'weight_kg'::public.set_value_type) THEN st.value_2_numeric
                    ELSE (0)::numeric
                END) DESC, s.started_at DESC
        ), one_rm_prs AS (
         SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id) s.tenant_id,
            s.user_id,
            st.exercise_id,
            e.name AS exercise_name,
            '1rm_estimate'::text AS pr_type,
            public.calculate_one_rm(GREATEST(
                CASE
                    WHEN (st.value_1_type = 'weight_kg'::public.set_value_type) THEN st.value_1_numeric
                    ELSE (0)::numeric
                END,
                CASE
                    WHEN (st.value_2_type = 'weight_kg'::public.set_value_type) THEN st.value_2_numeric
                    ELSE (0)::numeric
                END), st.reps) AS value,
            s.started_at AS achieved_at
           FROM ((public.sessions s
             JOIN public.sets st ON ((s.session_id = st.session_id)))
             JOIN public.exercises e ON ((st.exercise_id = e.exercise_id)))
          WHERE (((st.value_1_type = 'weight_kg'::public.set_value_type) OR (st.value_2_type = 'weight_kg'::public.set_value_type)) AND (st.reps IS NOT NULL) AND (s.completed_at IS NOT NULL))
          ORDER BY s.tenant_id, s.user_id, st.exercise_id, (public.calculate_one_rm(GREATEST(
                CASE
                    WHEN (st.value_1_type = 'weight_kg'::public.set_value_type) THEN st.value_1_numeric
                    ELSE (0)::numeric
                END,
                CASE
                    WHEN (st.value_2_type = 'weight_kg'::public.set_value_type) THEN st.value_2_numeric
                    ELSE (0)::numeric
                END), st.reps)) DESC, s.started_at DESC
        )
 SELECT weight_prs.tenant_id,
    weight_prs.user_id,
    weight_prs.exercise_id,
    weight_prs.exercise_name,
    weight_prs.pr_type,
    weight_prs.value,
    weight_prs.achieved_at
   FROM weight_prs
UNION ALL
 SELECT one_rm_prs.tenant_id,
    one_rm_prs.user_id,
    one_rm_prs.exercise_id,
    one_rm_prs.exercise_name,
    one_rm_prs.pr_type,
    one_rm_prs.value,
    one_rm_prs.achieved_at
   FROM one_rm_prs;


--
-- Name: program_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.program_assignments (
    assignment_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    program_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    starts_at date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programs (
    program_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration_weeks integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT programs_duration_weeks_check CHECK ((duration_weeks > 0)),
    CONSTRAINT programs_name_check CHECK (((length(name) > 0) AND (length(name) <= 255)))
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    tenant_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    branding jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenants_name_check CHECK (((length(name) > 0) AND (length(name) <= 255)))
);


--
-- Name: training_volume_weekly; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.training_volume_weekly AS
 SELECT s.tenant_id,
    s.user_id,
    s.category,
    date_trunc('week'::text, s.started_at) AS week_start,
    count(DISTINCT s.session_id) AS session_count,
    count(st.set_id) AS total_sets,
    COALESCE(sum(
        CASE
            WHEN ((st.value_1_type = 'weight_kg'::public.set_value_type) AND (st.reps IS NOT NULL)) THEN (st.value_1_numeric * (st.reps)::numeric)
            WHEN ((st.value_2_type = 'weight_kg'::public.set_value_type) AND (st.reps IS NOT NULL)) THEN (st.value_2_numeric * (st.reps)::numeric)
            ELSE (0)::numeric
        END), (0)::numeric) AS strength_volume,
    COALESCE(sum(
        CASE
            WHEN (st.value_1_type = 'distance_m'::public.set_value_type) THEN st.value_1_numeric
            WHEN (st.value_2_type = 'distance_m'::public.set_value_type) THEN st.value_2_numeric
            ELSE (0)::numeric
        END), (0)::numeric) AS total_distance,
    COALESCE(sum(
        CASE
            WHEN (st.value_1_type = 'duration_s'::public.set_value_type) THEN st.value_1_numeric
            WHEN (st.value_2_type = 'duration_s'::public.set_value_type) THEN st.value_2_numeric
            ELSE (0)::numeric
        END), (0)::numeric) AS total_duration,
    COALESCE(sum(
        CASE
            WHEN (st.value_1_type = 'calories'::public.set_value_type) THEN st.value_1_numeric
            WHEN (st.value_2_type = 'calories'::public.set_value_type) THEN st.value_2_numeric
            ELSE (0)::numeric
        END), (0)::numeric) AS total_calories
   FROM (public.sessions s
     LEFT JOIN public.sets st ON ((s.session_id = st.session_id)))
  WHERE (s.completed_at IS NOT NULL)
  GROUP BY s.tenant_id, s.user_id, s.category, (date_trunc('week'::text, s.started_at))
  WITH NO DATA;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tenant_id uuid NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'athlete'::public.user_role NOT NULL,
    first_name text,
    last_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text,
    about text
);


--
-- Name: workouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workouts (
    workout_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    program_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    day_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT workouts_day_index_check CHECK ((day_index >= 0))
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: exercise_templates exercise_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercise_templates
    ADD CONSTRAINT exercise_templates_pkey PRIMARY KEY (template_id);


--
-- Name: exercises exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exercises
    ADD CONSTRAINT exercises_pkey PRIMARY KEY (exercise_id);


--
-- Name: migrations migrations_filename_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_filename_key UNIQUE (filename);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: program_assignments program_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_pkey PRIMARY KEY (assignment_id);


--
-- Name: program_assignments program_assignments_tenant_id_program_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_tenant_id_program_id_user_id_key UNIQUE (tenant_id, program_id, user_id);


--
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (program_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (session_id);


--
-- Name: sets sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_pkey PRIMARY KEY (set_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (tenant_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_tenant_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email);


--
-- Name: workouts workouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_pkey PRIMARY KEY (workout_id);


--
-- Name: idx_exercise_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercise_templates_category ON public.exercise_templates USING btree (exercise_category);


--
-- Name: idx_exercise_templates_category_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercise_templates_category_type ON public.exercise_templates USING btree (exercise_category, exercise_type);


--
-- Name: idx_exercise_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercise_templates_name ON public.exercise_templates USING btree (name);


--
-- Name: idx_exercise_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercise_templates_type ON public.exercise_templates USING btree (exercise_type);


--
-- Name: idx_exercises_default_types; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercises_default_types ON public.exercises USING btree (default_value_1_type, default_value_2_type);


--
-- Name: idx_exercises_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_exercises_name_unique ON public.exercises USING btree (name);


--
-- Name: idx_exercises_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exercises_type ON public.exercises USING btree (exercise_type);


--
-- Name: idx_muscle_group_volume; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_muscle_group_volume ON public.muscle_group_volume USING btree (tenant_id, user_id, muscle_group, month_start);


--
-- Name: idx_sessions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_category ON public.sessions USING btree (tenant_id, category, started_at DESC);


--
-- Name: idx_sessions_tenant_user_started; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_tenant_user_started ON public.sessions USING btree (tenant_id, user_id, started_at DESC);


--
-- Name: idx_sessions_user_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_completed ON public.sessions USING btree (user_id, completed_at) WHERE (completed_at IS NOT NULL);


--
-- Name: idx_sets_exercise_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sets_exercise_session ON public.sets USING btree (exercise_id, session_id);


--
-- Name: idx_sets_session_exercise; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sets_session_exercise ON public.sets USING btree (session_id, exercise_id, set_index);


--
-- Name: idx_sets_tenant_exercise; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sets_tenant_exercise ON public.sets USING btree (tenant_id, exercise_id, created_at DESC);


--
-- Name: idx_training_volume_weekly_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_training_volume_weekly_unique ON public.training_volume_weekly USING btree (tenant_id, user_id, category, week_start);


--
-- Name: idx_users_tenant_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tenant_email ON public.users USING btree (tenant_id, email);


--
-- Name: exercise_templates update_exercise_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exercise_templates_updated_at BEFORE UPDATE ON public.exercise_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: exercises update_exercises_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: program_assignments update_program_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_program_assignments_updated_at BEFORE UPDATE ON public.program_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: programs update_programs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sets update_sets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON public.sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tenants update_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: workouts update_workouts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: program_assignments program_assignments_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON DELETE CASCADE;


--
-- Name: program_assignments program_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: program_assignments program_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.program_assignments
    ADD CONSTRAINT program_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: programs programs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: sessions sessions_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON DELETE SET NULL;


--
-- Name: sessions sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: sets sets_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(exercise_id) ON DELETE CASCADE;


--
-- Name: sets sets_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(session_id) ON DELETE CASCADE;


--
-- Name: sets sets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sets
    ADD CONSTRAINT sets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: workouts workouts_program_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON DELETE CASCADE;


--
-- Name: workouts workouts_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workouts
    ADD CONSTRAINT workouts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON DELETE CASCADE;


--
-- Name: program_assignments assignment_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignment_isolation_policy ON public.program_assignments USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: program_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.program_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: programs program_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY program_isolation_policy ON public.programs USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: programs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions session_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY session_isolation_policy ON public.sessions USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: sessions session_user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY session_user_policy ON public.sessions USING (((tenant_id = public.current_tenant_id()) AND ((user_id = (current_setting('rythm.current_user_id'::text, true))::uuid) OR (current_setting('rythm.user_role'::text, true) = ANY (ARRAY['coach'::text, 'tenant_admin'::text])))));


--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sets set_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY set_isolation_policy ON public.sets USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: sets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants tenant_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_policy ON public.tenants USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: users user_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_isolation_policy ON public.users USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: workouts workout_isolation_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY workout_isolation_policy ON public.workouts USING ((public.is_org_admin() OR (tenant_id = public.current_tenant_id())));


--
-- Name: workouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict vLZT3QWkpF2NmWcmlHFqHqnPVB1k3AiigOtOitYoL4GHwDloLXoVGiZDzo6OFtY

