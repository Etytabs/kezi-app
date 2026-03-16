--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.conversations OWNER TO "user";

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO "user";

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: cycle_logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.cycle_logs (
    id integer NOT NULL,
    user_id integer,
    date date NOT NULL,
    bbt double precision,
    cervical_mucus text,
    mood text,
    cramps boolean,
    headache boolean,
    fatigue boolean,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cycle_logs OWNER TO "user";

--
-- Name: cycle_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.cycle_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cycle_logs_id_seq OWNER TO "user";

--
-- Name: cycle_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.cycle_logs_id_seq OWNED BY public.cycle_logs.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO "user";

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO "user";

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: period_logs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.period_logs (
    id integer NOT NULL,
    user_id integer,
    start_date date NOT NULL,
    end_date date,
    flow text,
    pain_level integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.period_logs OWNER TO "user";

--
-- Name: period_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.period_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.period_logs_id_seq OWNER TO "user";

--
-- Name: period_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.period_logs_id_seq OWNED BY public.period_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: cycle_logs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cycle_logs ALTER COLUMN id SET DEFAULT nextval('public.cycle_logs_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: period_logs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.period_logs ALTER COLUMN id SET DEFAULT nextval('public.period_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.conversations (id, user_id, created_at) FROM stdin;
1	1	2026-03-11 15:02:51.879919
2	1	2026-03-11 15:12:16.616892
3	1	2026-03-11 17:07:35.729667
\.


--
-- Data for Name: cycle_logs; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.cycle_logs (id, user_id, date, bbt, cervical_mucus, mood, cramps, headache, fatigue, created_at) FROM stdin;
1	1	2026-03-11	36.5	eggwhite	happy	f	f	t	2026-03-11 16:32:29.548127
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.messages (id, conversation_id, role, content, created_at) FROM stdin;
1	1	user	Explain quantum computing simply	2026-03-11 15:02:51.883017
2	1	assistant	Sure! Quantum computing is a type of computing that uses the principles of quantum mechanics to process information.\n\nIn regular computers, the basic unit of information is a **bit**, which can be either 0 or 1. But in quantum computers, the basic unit is a **quantum bit** or **qubit**, which can be 0, 1, or both at the same time — thanks to a strange property called **superposition**.\n\nAlso, qubits can be connected through something called **entanglement**, meaning the state of one qubit can depend on the state of another, even if they are far apart.\n\nBecause of superposition and entanglement, quantum computers can process a vast number of possibilities all at once. This makes them potentially very powerful for certain tasks, like factoring big numbers, searching databases, or simulating molecules for drug discovery.\n\nIn simple terms: quantum computers are like super-powerful problem solvers that use the weird rules of quantum physics to do many calculations simultaneously.	2026-03-11 15:02:56.793
3	2	user	Hello	2026-03-11 15:12:16.620801
4	2	assistant	Hello! How can I assist you today?	2026-03-11 15:12:17.44888
5	3	user	Explain ovulation simply	2026-03-11 17:07:35.737687
6	3	assistant	Sure! Ovulation is a natural part of a woman’s menstrual cycle. Here’s a simple explanation:\n\n1. **What is ovulation?**  \n   Ovulation is when an ovary releases a mature egg.\n\n2. **When does it happen?**  \n   It usually happens about halfway through the menstrual cycle (around day 14 in a typical 28-day cycle).\n\n3. **Why is it important?**  \n   The released egg can be fertilized by sperm, which can lead to pregnancy.\n\n4. **How long does the egg last?**  \n   After ovulation, the egg is alive and able to be fertilized for about 12-24 hours.\n\n5. **What happens if the egg isn’t fertilized?**  \n   If no sperm fertilizes the egg, it breaks down and the body sheds the lining of the uterus during menstruation.\n\nSo, ovulation is basically the time when a woman’s body is most ready for pregnancy!	2026-03-11 17:07:40.095872
\.


--
-- Data for Name: period_logs; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.period_logs (id, user_id, start_date, end_date, flow, pain_level, created_at) FROM stdin;
1	1	2026-03-01	2026-03-05	medium	4	2026-03-11 16:39:48.047243
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.users (id, email, password_hash, created_at) FROM stdin;
1	test@mail.com	$2b$10$0.C4GqQccDPtRYHuflYjIuSzADrs5HNQtCMj/19VxWkkhPDOs.lzu	2026-03-11 14:28:35.470595
\.


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.conversations_id_seq', 3, true);


--
-- Name: cycle_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.cycle_logs_id_seq', 1, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.messages_id_seq', 6, true);


--
-- Name: period_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.period_logs_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: cycle_logs cycle_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cycle_logs
    ADD CONSTRAINT cycle_logs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: period_logs period_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.period_logs
    ADD CONSTRAINT period_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_period_logs_user; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX idx_period_logs_user ON public.period_logs USING btree (user_id, start_date);


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cycle_logs cycle_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cycle_logs
    ADD CONSTRAINT cycle_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: period_logs period_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.period_logs
    ADD CONSTRAINT period_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

