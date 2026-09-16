-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 16 sep. 2026 à 08:24
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `akfashionplus`
--

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(150) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_data`)),
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_data`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `ip_address`, `created_at`) VALUES
(1, 1, 'seed.created', 'database', NULL, NULL, '{\"environment\": \"development\", \"description\": \"Initial demo data\"}', '127.0.0.1', '2026-08-10 14:48:22'),
(2, 1, 'gift_card.created', 'gift_card', 3, NULL, '{\"serial_number\": \"AKF-GC-SENGA-000001\", \"value_eur\": 300}', '127.0.0.1', '2026-08-10 14:48:22'),
(3, 8, 'exchange_rate.updated', 'exchange_rate', 2, NULL, '{\"rate\": 1625}', '::1', '2026-08-15 04:31:24'),
(4, 8, 'exchange_rate.updated', 'exchange_rate', 3, NULL, '{\"rate\": 1270}', '::1', '2026-08-27 11:19:02'),
(5, 7, 'second_hand_proposal.submitted', 'second_hand_proposal', 1, NULL, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":null,\"final_price_eur\":null,\"status\":\"submitted\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":null,\"evaluated_at\":null,\"admin_notes\":null,\"handover_method\":null,\"handover_instructions\":null,\"user_responded_at\":null,\"accepted_at\":null,\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T02:31:08.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":null}', '::ffff:192.168.129.2', '2026-08-31 02:31:08'),
(6, 7, 'second_hand_proposal.images_uploaded', 'second_hand_proposal', 1, NULL, '{\"count\":3}', '::ffff:192.168.129.2', '2026-08-31 02:31:09'),
(7, 8, 'second_hand_proposal.offer_sent', 'second_hand_proposal', 1, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":null,\"final_price_eur\":null,\"status\":\"submitted\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":null,\"evaluated_at\":null,\"admin_notes\":null,\"handover_method\":null,\"handover_instructions\":null,\"user_responded_at\":null,\"accepted_at\":null,\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T02:31:08.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":null}', '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"offer_sent\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":null,\"handover_instructions\":null,\"user_responded_at\":null,\"accepted_at\":null,\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:07:06.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '::1', '2026-08-31 03:07:06'),
(8, 7, 'second_hand_proposal.accepted', 'second_hand_proposal', 1, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"offer_sent\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":null,\"handover_instructions\":null,\"user_responded_at\":null,\"accepted_at\":null,\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:07:06.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"accepted\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":null,\"handover_instructions\":null,\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:08:31.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '::ffff:192.168.129.2', '2026-08-31 03:08:31'),
(9, 8, 'second_hand_proposal.instructions_set', 'second_hand_proposal', 1, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"accepted\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":null,\"handover_instructions\":null,\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:08:31.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"awaiting_item\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:09:27.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '::1', '2026-08-31 03:09:27'),
(10, 8, 'second_hand_proposal.paid', 'second_hand_proposal', 1, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"awaiting_item\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":null,\"payment_reference\":null,\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:09:27.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"paid\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":\"2026-08-31T03:10:36.000Z\",\"payment_reference\":\"896547123\",\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:10:36.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '::1', '2026-08-31 03:10:36'),
(11, 8, 'second_hand_proposal.item_received', 'second_hand_proposal', 1, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"paid\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":null,\"verified_at\":null,\"paid_at\":\"2026-08-31T03:10:36.000Z\",\"payment_reference\":\"896547123\",\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:10:36.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"item_received\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":\"2026-08-31T03:11:11.000Z\",\"verified_at\":null,\"paid_at\":\"2026-08-31T03:10:36.000Z\",\"payment_reference\":\"896547123\",\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:11:11.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '::1', '2026-08-31 03:11:11'),
(12, 8, 'second_hand_proposal.status_updated', 'second_hand_proposal', 1, '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"item_received\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":\"2026-08-31T03:11:11.000Z\",\"verified_at\":null,\"paid_at\":\"2026-08-31T03:10:36.000Z\",\"payment_reference\":\"896547123\",\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:11:11.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '{\"id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\",\"user_id\":7,\"category_id\":null,\"item_type\":\"Pangalon\",\"brand\":\"Zara\",\"size\":\"M\",\"color\":\"Rouge\",\"condition_state\":\"good\",\"description\":\"C\'est top ce pantalon\",\"desired_price_eur\":26,\"offered_price_eur\":10,\"final_price_eur\":10,\"status\":\"completed\",\"bank_account_holder\":\"Akam Baran\",\"bank_account_number\":\"D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==\",\"bank_name\":\"Belgas\",\"evaluated_by\":8,\"evaluated_at\":\"2026-08-31T03:07:06.000Z\",\"admin_notes\":\"Nous voyons que l\'habit a l\'aire abimé\",\"handover_method\":\"dropoff\",\"handover_instructions\":\"Venez avec à l\'avenue\",\"user_responded_at\":\"2026-08-31T03:08:31.000Z\",\"accepted_at\":\"2026-08-31T03:08:31.000Z\",\"rejected_at\":null,\"item_received_at\":\"2026-08-31T03:11:11.000Z\",\"verified_at\":null,\"paid_at\":\"2026-08-31T03:10:36.000Z\",\"payment_reference\":\"896547123\",\"created_at\":\"2026-08-31T02:31:08.000Z\",\"updated_at\":\"2026-08-31T03:11:26.000Z\",\"category_name_fr\":null,\"category_name_en\":null,\"category_name_pt\":null,\"user_name\":\"Josiane Nsama Ename\",\"user_email\":\"josianne@ak.com\",\"user_phone\":\"+3248598745\",\"user_language\":\"fr\",\"evaluated_by_name\":\"AMRAM GOULMEMEI BASSIME\"}', '::1', '2026-08-31 03:11:26');

-- --------------------------------------------------------

--
-- Structure de la table `branches`
--

CREATE TABLE `branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `address_line_1` varchar(255) NOT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `city` varchar(150) NOT NULL,
  `province` varchar(150) DEFAULT NULL,
  `postal_code` varchar(30) DEFAULT NULL,
  `country_code` char(2) NOT NULL DEFAULT 'AO',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `opening_hours` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `branches`
--

INSERT INTO `branches` (`id`, `name`, `code`, `phone`, `email`, `address_line_1`, `address_line_2`, `city`, `province`, `postal_code`, `country_code`, `latitude`, `longitude`, `opening_hours`, `status`, `created_at`, `updated_at`) VALUES
(1, 'AK Fashion Plus - Luanda Centro', 'LDA-CENTRO', '+244923000001', 'luanda.centro@akfashionplus.com', 'Rua Rainha Ginga, 120', NULL, 'Luanda', 'Luanda', NULL, 'AO', -8.83833300, 13.23444400, 'Lundi - Samedi : 09h00 - 19h00', 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(2, 'AK Fashion Plus - Talatona', 'LDA-TALATONA', '+244923000002', 'talatona@akfashionplus.com', 'Avenida de Talatona', 'Belas Shopping', 'Luanda', 'Luanda', NULL, 'AO', -8.91800000, 13.18400000, 'Lundi - Dimanche : 10h00 - 20h00', 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 'AK Fashion Plus - Benguela', 'BGU-CENTRO', '+244923000003', 'benguela@akfashionplus.com', 'Rua 31 de Janeiro', NULL, 'Benguela', 'Benguela', NULL, 'AO', -12.57630000, 13.40550000, 'Lundi - Samedi : 09h00 - 18h00', 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22');

-- --------------------------------------------------------

--
-- Structure de la table `carts`
--

CREATE TABLE `carts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('active','converted','abandoned') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 6, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22');

-- --------------------------------------------------------

--
-- Structure de la table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `product_variant_id` bigint(20) UNSIGNED NOT NULL,
  `item_type` enum('purchase','rental') NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `rental_start_date` date DEFAULT NULL,
  `rental_end_date` date DEFAULT NULL,
  `rental_days` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `product_variant_id`, `item_type`, `quantity`, `rental_start_date`, `rental_end_date`, `rental_days`, `created_at`, `updated_at`) VALUES
(1, 1, 8, 'purchase', 1, NULL, NULL, NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22');

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `slug` varchar(180) NOT NULL,
  `name_fr` varchar(150) NOT NULL,
  `name_en` varchar(150) NOT NULL,
  `name_pt` varchar(150) NOT NULL,
  `description_fr` text DEFAULT NULL,
  `description_en` text DEFAULT NULL,
  `description_pt` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `parent_id`, `slug`, `name_fr`, `name_en`, `name_pt`, `description_fr`, `description_en`, `description_pt`, `image_url`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
(1, NULL, 'femmes', 'Femmes', 'Women', 'Mulheres', 'Mode et accessoires pour femmes.', 'Fashion and accessories for women.', 'Moda e acessórios para mulheres.', 'https://i.etsystatic.com/8257521/r/il/512134/6774440616/il_300x300.6774440616_pwwq.jpg', 1, 'active', '2026-08-10 14:48:22', '2026-08-18 22:35:53'),
(2, NULL, 'hommes', 'Hommes', 'Men', 'Homens', 'Mode et accessoires pour hommes.', 'Fashion and accessories for men.', 'Moda e acessórios para homens.', 'https://i.etsystatic.com/8257521/r/il/512134/6774440616/il_300x300.6774440616_pwwq.jpg', 2, 'active', '2026-08-10 14:48:22', '2026-08-18 22:35:57'),
(3, 1, 'robes', 'Robes', 'Dresses', 'Vestidos', 'Robes pour toutes les occasions.', 'Dresses for every occasion.', 'Vestidos para todas as ocasiões.', 'https://i.etsystatic.com/8257521/r/il/512134/6774440616/il_300x300.6774440616_pwwq.jpg', 3, 'active', '2026-08-10 14:48:22', '2026-08-18 22:36:05'),
(4, 2, 'costumes', 'Costumes', 'Suits', 'Fatos', 'Costumes élégants et professionnels.', 'Elegant and professional suits.', 'Fatos elegantes e profissionais.', 'https://i.etsystatic.com/8257521/r/il/512134/6774440616/il_300x300.6774440616_pwwq.jpg', 4, 'active', '2026-08-10 14:48:22', '2026-08-18 22:36:10'),
(5, NULL, 'accessoires', 'Accessoires', 'Accessories', 'Acessórios', 'Sacs, chaussures et accessoires.', 'Bags, shoes and accessories.', 'Bolsas, sapatos e acessórios.', 'https://i.etsystatic.com/8257521/r/il/512134/6774440616/il_300x300.6774440616_pwwq.jpg', 5, 'active', '2026-08-10 14:48:22', '2026-08-18 22:36:15');

-- --------------------------------------------------------

--
-- Structure de la table `company_resales`
--

CREATE TABLE `company_resales` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_item_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `amount_eur` decimal(12,2) NOT NULL,
  `exchange_rate_eur_to_aoa` decimal(18,6) NOT NULL,
  `payout_amount_aoa` decimal(18,2) NOT NULL,
  `beneficiary_name` varchar(200) NOT NULL,
  `beneficiary_phone` varchar(50) DEFAULT NULL,
  `status` enum('pending','approved','ready_for_payout','paid','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `cashier_id` bigint(20) UNSIGNED DEFAULT NULL,
  `identity_document_type` varchar(100) DEFAULT NULL,
  `identity_document_number` varchar(150) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `requested_at` datetime NOT NULL DEFAULT current_timestamp(),
  `approved_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `company_resales`
--

INSERT INTO `company_resales` (`id`, `order_item_id`, `user_id`, `branch_id`, `amount_eur`, `exchange_rate_eur_to_aoa`, `payout_amount_aoa`, `beneficiary_name`, `beneficiary_phone`, `status`, `cashier_id`, `identity_document_type`, `identity_document_number`, `notes`, `requested_at`, `approved_at`, `paid_at`, `approved_by`, `created_at`, `updated_at`) VALUES
(1, 20, 7, 1, 89.90, 1625.000000, 146087.50, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-18 23:55:29', NULL, NULL, NULL, '2026-08-18 21:55:29', '2026-08-18 21:55:29'),
(2, 22, 7, 1, 179.80, 1625.000000, 292175.00, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-18 23:58:51', NULL, NULL, NULL, '2026-08-18 21:58:51', '2026-08-18 21:58:51'),
(3, 13, 6, 1, 299.90, 1625.000000, 487337.50, 'Ana Kiala', '+244 912 345 678', 'approved', NULL, NULL, NULL, 'Mise a jour admin: Approuvee', '2026-08-19 00:14:44', '2026-08-19 00:51:16', NULL, 8, '2026-08-18 22:14:44', '2026-08-18 22:51:16'),
(4, 14, 6, 1, 299.90, 1625.000000, 487337.50, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-19 00:14:44', NULL, NULL, NULL, '2026-08-18 22:14:44', '2026-08-18 22:14:44'),
(5, 15, 6, 1, 299.90, 1625.000000, 487337.50, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-19 00:14:44', NULL, NULL, NULL, '2026-08-18 22:14:44', '2026-08-18 22:14:44'),
(6, 3, 7, 1, 149.90, 1000.000000, 149900.00, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-19 00:14:44', NULL, NULL, NULL, '2026-08-18 22:14:44', '2026-08-18 22:14:44'),
(7, 4, 7, 1, 199.90, 1000.000000, 199900.00, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-19 00:14:44', NULL, NULL, NULL, '2026-08-18 22:14:44', '2026-08-18 22:14:44'),
(8, 5, 7, 1, 299.90, 1000.000000, 299900.00, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-19 00:14:44', NULL, NULL, NULL, '2026-08-18 22:14:44', '2026-08-18 22:14:44'),
(9, 10, 7, 3, 199.90, 1000.000000, 199900.00, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-19 00:14:44', NULL, NULL, NULL, '2026-08-18 22:14:44', '2026-08-18 22:14:44'),
(10, 38, 7, 1, 79.90, 1625.000000, 129837.50, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-27 12:56:17', NULL, NULL, NULL, '2026-08-27 10:56:17', '2026-08-27 10:56:17'),
(11, 39, 7, 1, 79.90, 1625.000000, 129837.50, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-27 12:59:39', NULL, NULL, NULL, '2026-08-27 10:59:39', '2026-08-27 10:59:39'),
(12, 40, 7, 1, 79.90, 1625.000000, 129837.50, 'Ana Kiala', '+244 912 345 678', 'pending', NULL, NULL, NULL, NULL, '2026-08-27 12:59:39', NULL, NULL, NULL, '2026-08-27 10:59:39', '2026-08-27 10:59:39');

-- --------------------------------------------------------

--
-- Structure de la table `delivery_countries`
--

CREATE TABLE `delivery_countries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `country_code` char(2) NOT NULL,
  `country_name` varchar(150) NOT NULL,
  `delivery_price_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `delivery_countries`
--

INSERT INTO `delivery_countries` (`id`, `country_code`, `country_name`, `delivery_price_eur`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'AO', 'Angola', 5.00, 'active', 1, '2026-08-28 09:22:13', '2026-08-28 09:22:13'),
(2, 'BE', 'Belgique', 10.00, 'active', 2, '2026-08-28 09:23:10', '2026-08-28 09:23:10');

-- --------------------------------------------------------

--
-- Structure de la table `exchange_rates`
--

CREATE TABLE `exchange_rates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `base_currency` char(3) NOT NULL DEFAULT 'EUR',
  `quote_currency` char(3) NOT NULL DEFAULT 'AOA',
  `rate` decimal(18,6) NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `exchange_rates`
--

INSERT INTO `exchange_rates` (`id`, `base_currency`, `quote_currency`, `rate`, `is_current`, `created_by`, `created_at`) VALUES
(1, 'EUR', 'AOA', 1000.000000, 0, NULL, '2026-08-10 12:16:59'),
(2, 'EUR', 'AOA', 1625.000000, 0, 8, '2026-08-15 04:31:24'),
(3, 'EUR', 'AOA', 1270.000000, 1, 8, '2026-08-27 11:19:02');

-- --------------------------------------------------------

--
-- Structure de la table `favorites`
--

CREATE TABLE `favorites` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `product_id`, `created_at`) VALUES
(1, 4, 1, '2026-08-10 14:48:22'),
(2, 4, 4, '2026-08-10 14:48:22'),
(3, 5, 3, '2026-08-10 14:48:22'),
(4, 7, 2, '2026-08-14 06:37:30'),
(7, 7, 7, '2026-08-21 09:40:43'),
(8, 7, 4, '2026-08-21 09:40:47');

-- --------------------------------------------------------

--
-- Structure de la table `gift_cards`
--

CREATE TABLE `gift_cards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `gift_card_type_id` bigint(20) UNSIGNED NOT NULL,
  `serial_number` varchar(100) NOT NULL,
  `purchased_by` bigint(20) UNSIGNED DEFAULT NULL,
  `owner_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `initial_balance_eur` decimal(12,2) NOT NULL,
  `current_balance_eur` decimal(12,2) NOT NULL,
  `reserved_balance_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `source` enum('customer_purchase','admin_created') NOT NULL,
  `status` enum('pending_payment','unassigned','active','blocked','fully_used','expired','cancelled') NOT NULL DEFAULT 'unassigned',
  `expires_at` datetime DEFAULT NULL,
  `activated_at` datetime DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `gift_cards`
--

INSERT INTO `gift_cards` (`id`, `gift_card_type_id`, `serial_number`, `purchased_by`, `owner_user_id`, `initial_balance_eur`, `current_balance_eur`, `reserved_balance_eur`, `source`, `status`, `expires_at`, `activated_at`, `assigned_at`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 5, 'AKF-GC-MWANZA-000001', 4, 4, 100.00, 100.00, 0.00, 'customer_purchase', 'active', NULL, '2026-08-10 16:48:22', '2026-08-10 16:48:22', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(2, 4, 'AKF-GC-KIMOLO-000001', NULL, 5, 200.00, 150.00, 0.00, 'admin_created', 'active', NULL, '2026-08-10 16:48:22', '2026-08-10 16:48:22', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 3, 'AKF-GC-SENGA-000001', NULL, NULL, 300.00, 300.00, 0.00, 'admin_created', 'unassigned', NULL, NULL, NULL, 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(4, 5, 'GC-20260814061318-6ECFF1', 7, 7, 100.00, 0.00, 0.00, 'customer_purchase', 'fully_used', NULL, '2026-08-14 08:13:18', '2026-08-14 08:13:18', 7, '2026-08-14 06:13:18', '2026-08-21 10:36:18'),
(5, 3, 'GC-20260814061502-99E2DE', 7, 7, 300.00, 0.00, 0.00, 'customer_purchase', 'fully_used', NULL, '2026-08-14 08:15:02', '2026-08-14 08:15:02', 7, '2026-08-14 06:15:02', '2026-08-21 09:51:53'),
(6, 3, 'GC-20260814062505-DAB234', 7, 7, 300.00, 0.00, 0.00, 'customer_purchase', 'fully_used', NULL, '2026-08-14 08:25:05', '2026-08-14 08:25:05', 7, '2026-08-14 06:25:05', '2026-08-21 09:51:53'),
(7, 4, 'GC-20260821073359-E75626', 8, 8, 200.00, 200.00, 0.00, 'customer_purchase', 'pending_payment', NULL, '2026-08-21 09:33:59', '2026-08-21 09:33:59', 8, '2026-08-21 07:33:59', '2026-08-21 07:33:59'),
(8, 1, 'GC-20260821082650-7A14E1', 7, 7, 1000.00, 0.00, 0.00, 'customer_purchase', 'fully_used', NULL, '2026-08-21 10:26:50', '2026-08-21 10:26:50', 7, '2026-08-21 08:26:50', '2026-08-21 10:36:55'),
(9, 2, 'GC-20260821105831-9CBF03', 7, 7, 500.00, 500.00, 0.00, 'customer_purchase', 'pending_payment', NULL, '2026-08-21 12:58:31', '2026-08-21 12:58:31', 7, '2026-08-21 10:58:31', '2026-08-21 10:58:31'),
(10, 1, 'GC-20260821110002-5525E6', 7, 7, 1000.00, 0.00, 0.00, 'customer_purchase', 'fully_used', NULL, '2026-08-21 13:00:02', '2026-08-21 13:00:02', 7, '2026-08-21 11:00:02', '2026-08-21 11:01:46'),
(11, 1, 'GC-20260828152219-3DF1CF', 7, 7, 1000.00, 0.00, 0.00, 'customer_purchase', 'fully_used', NULL, '2026-08-28 17:22:19', '2026-08-28 17:22:19', 7, '2026-08-28 15:22:19', '2026-08-28 15:23:31');

-- --------------------------------------------------------

--
-- Structure de la table `gift_card_transactions`
--

CREATE TABLE `gift_card_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transaction_reference` varchar(100) NOT NULL,
  `gift_card_id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('created','activated','assigned','payment_reserved','payment_completed','payment_released','refund','admin_credit','admin_debit','blocked','unblocked','expired','cancelled') NOT NULL,
  `amount_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `balance_before_eur` decimal(12,2) NOT NULL,
  `balance_after_eur` decimal(12,2) NOT NULL,
  `reserved_before_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `reserved_after_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `gift_card_transactions`
--

INSERT INTO `gift_card_transactions` (`id`, `transaction_reference`, `gift_card_id`, `payment_id`, `order_id`, `type`, `amount_eur`, `balance_before_eur`, `balance_after_eur`, `reserved_before_eur`, `reserved_after_eur`, `description`, `created_by`, `created_at`) VALUES
(1, 'GCT-DEMO-000001', 1, NULL, NULL, 'created', 100.00, 0.00, 100.00, 0.00, 0.00, 'Création de la carte cadeau Mwanza', 1, '2026-08-10 14:48:22'),
(2, 'GCT-DEMO-000002', 2, NULL, NULL, 'created', 200.00, 0.00, 200.00, 0.00, 0.00, 'Création de la carte cadeau Kimolo', 1, '2026-08-10 14:48:22'),
(3, 'GCT-DEMO-000003', 2, NULL, NULL, 'admin_debit', 50.00, 200.00, 150.00, 0.00, 0.00, 'Débit de démonstration', 1, '2026-08-10 14:48:22'),
(4, 'GCT-ED31625A97A8', 6, 8, NULL, 'created', 300.00, 0.00, 300.00, 0.00, 0.00, 'Customer gift card purchase via Stripe', 7, '2026-08-14 06:25:19'),
(5, 'GCT-20260814062636-415DA8', 6, 9, 7, 'payment_completed', 204.90, 300.00, 95.10, 0.00, 0.00, 'Order 7 paid with gift card', 7, '2026-08-14 06:26:36'),
(6, 'GCT-1DB97FB39D3A', 8, 19, NULL, 'created', 1000.00, 0.00, 1000.00, 0.00, 0.00, 'Customer gift card purchase via Stripe', 7, '2026-08-21 08:27:15'),
(7, 'GCT-20260821095153-391EA6', 6, 20, 16, 'payment_completed', 95.10, 95.10, 0.00, 0.00, 0.00, 'Paiement commande par carte cadeau', 7, '2026-08-21 09:51:53'),
(8, 'GCT-20260821095153-4C0589', 5, 21, 16, 'payment_completed', 300.00, 300.00, 0.00, 0.00, 0.00, 'Paiement commande par carte cadeau', 7, '2026-08-21 09:51:53'),
(9, 'GCT-20260821095153-6BD3EA', 8, 22, 16, 'payment_completed', 214.70, 1000.00, 785.30, 0.00, 0.00, 'Paiement commande par carte cadeau', 7, '2026-08-21 09:51:53'),
(10, 'GCT-20260821103618-DD7F61', 4, 24, 18, 'payment_completed', 100.00, 100.00, 0.00, 0.00, 0.00, 'Paiement commande par carte cadeau', 7, '2026-08-21 10:36:18'),
(11, 'GCT-20260821103655-F0B960', 8, 26, 19, 'payment_completed', 785.30, 785.30, 0.00, 0.00, 0.00, 'Paiement commande par carte cadeau', 7, '2026-08-21 10:36:55'),
(12, 'GCT-843585299D4F', 10, 29, NULL, 'created', 1000.00, 0.00, 1000.00, 0.00, 0.00, 'Customer gift card purchase via Stripe', 7, '2026-08-21 11:00:27'),
(13, 'GCT-20260821110110-9BA220', 10, 30, 20, 'payment_reserved', 1000.00, 1000.00, 1000.00, 0.00, 1000.00, 'Reservation carte cadeau en attente du paiement Stripe', 7, '2026-08-21 11:01:10'),
(14, 'GCT-20260821110112-9E1AD3', 10, 30, 20, 'payment_released', 1000.00, 1000.00, 1000.00, 1000.00, 0.00, 'Paiement Stripe annule par le client', 7, '2026-08-21 11:01:12'),
(15, 'GCT-20260821110127-5E04BF', 10, 32, 21, 'payment_reserved', 1000.00, 1000.00, 1000.00, 0.00, 1000.00, 'Reservation carte cadeau en attente du paiement Stripe', 7, '2026-08-21 11:01:27'),
(16, 'GCT-20260821110146-450EB4', 10, 32, 21, 'payment_completed', 1000.00, 1000.00, 0.00, 1000.00, 0.00, 'Reservation carte cadeau finalisee apres paiement Stripe', 7, '2026-08-21 11:01:46'),
(17, 'GCT-50E6DE7CA2F4', 11, 39, NULL, 'created', 1000.00, 0.00, 1000.00, 0.00, 0.00, 'Customer gift card purchase via Stripe', 7, '2026-08-28 15:22:44'),
(18, 'GCT-20260828152317-C6782C', 11, 40, 27, 'payment_reserved', 1000.00, 1000.00, 1000.00, 0.00, 1000.00, 'Reservation carte cadeau en attente du paiement Stripe', 7, '2026-08-28 15:23:17'),
(19, 'GCT-20260828152331-38EEEA', 11, 40, 27, 'payment_completed', 1000.00, 1000.00, 0.00, 1000.00, 0.00, 'Reservation carte cadeau finalisee apres paiement Stripe', 7, '2026-08-28 15:23:31');

-- --------------------------------------------------------

--
-- Structure de la table `gift_card_types`
--

CREATE TABLE `gift_card_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) NOT NULL,
  `value_eur` decimal(12,2) NOT NULL,
  `description_fr` text DEFAULT NULL,
  `description_en` text DEFAULT NULL,
  `description_pt` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `gift_card_types`
--

INSERT INTO `gift_card_types` (`id`, `name`, `code`, `value_eur`, `description_fr`, `description_en`, `description_pt`, `image_url`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Kavula', 'KAVULA', 1000.00, NULL, NULL, NULL, NULL, 'active', NULL, '2026-08-10 12:16:59', '2026-08-10 12:16:59'),
(2, 'Leticia', 'LETICIA', 500.00, NULL, NULL, NULL, NULL, 'active', NULL, '2026-08-10 12:16:59', '2026-08-10 12:16:59'),
(3, 'Senga', 'SENGA', 300.00, NULL, NULL, NULL, NULL, 'active', NULL, '2026-08-10 12:16:59', '2026-08-10 12:16:59'),
(4, 'Kimolo', 'KIMOLO', 200.00, NULL, NULL, NULL, NULL, 'active', NULL, '2026-08-10 12:16:59', '2026-08-10 12:16:59'),
(5, 'Mwanza', 'MWANZA', 100.00, NULL, NULL, NULL, NULL, 'active', NULL, '2026-08-10 12:16:59', '2026-08-10 12:16:59');

-- --------------------------------------------------------

--
-- Structure de la table `important_links`
--

CREATE TABLE `important_links` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(180) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `pdf_url` varchar(600) NOT NULL,
  `pdf_filename` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_variant_id` bigint(20) UNSIGNED NOT NULL,
  `movement_type` enum('stock_in','sale','sale_cancelled','rental_out','rental_return','damage','lost','adjustment','company_resale') NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `quantity_before` int(10) UNSIGNED NOT NULL,
  `quantity_after` int(10) UNSIGNED NOT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `product_variant_id`, `movement_type`, `quantity_change`, `quantity_before`, `quantity_after`, `reference_type`, `reference_id`, `notes`, `created_by`, `created_at`) VALUES
(1, 1, 'stock_in', 8, 0, 8, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(2, 2, 'stock_in', 12, 0, 12, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(3, 3, 'stock_in', 7, 0, 7, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(4, 4, 'stock_in', 6, 0, 6, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(5, 5, 'stock_in', 5, 0, 5, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(6, 6, 'stock_in', 5, 0, 5, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(7, 7, 'stock_in', 5, 0, 5, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(8, 8, 'stock_in', 20, 0, 20, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(9, 9, 'stock_in', 15, 0, 15, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(10, 10, 'stock_in', 10, 0, 10, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22'),
(11, 11, 'stock_in', 2, 0, 2, 'initial_seed', NULL, 'Stock initial de démonstration', 1, '2026-08-10 14:48:22');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `data`, `is_read`, `read_at`, `created_at`) VALUES
(1, 4, 'payment_successful', 'Paiement confirmé', 'Votre paiement pour la commande AKF-2026-000001 a été confirmé.', '{\"order_number\": \"AKF-2026-000001\"}', 1, NULL, '2026-08-10 14:48:22'),
(2, 5, 'rental_active', 'Votre location est active', 'Votre Costume Premium Noir est actuellement en location.', '{\"order_number\": \"AKF-2026-000002\"}', 1, '2026-08-15 06:10:37', '2026-08-10 14:48:22'),
(3, 7, 'gift_card_received', 'Nouvelle carte cadeau', 'Vous avez reçu une carte cadeau Mwanza de 100 EUR.', '{\"serial_number\": \"AKF-GC-MWANZA-000001\"}', 1, '2026-08-18 23:01:24', '2026-08-10 14:48:22'),
(4, 7, 'second_hand_proposal_submitted', 'Proposition recue', 'Votre proposition de vente seconde main a ete recue.', '{\"proposal_id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\"}', 1, '2026-08-31 04:32:31', '2026-08-31 02:31:08'),
(5, 7, 'second_hand_offer_sent', 'Offre AK Fashion Plus', 'AK Fashion Plus a envoye une offre pour votre article.', '{\"proposal_id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\"}', 1, '2026-08-31 05:08:17', '2026-08-31 03:07:06'),
(6, 7, 'second_hand_instructions', 'Instructions disponibles', 'Les instructions pour remettre votre article sont disponibles.', '{\"proposal_id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\"}', 1, '2026-08-31 05:09:35', '2026-08-31 03:09:27'),
(7, 7, 'second_hand_paid', 'Paiement effectue', 'Le paiement de votre proposition seconde main a ete enregistre.', '{\"proposal_id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\"}', 1, '2026-08-31 05:10:43', '2026-08-31 03:10:36'),
(8, 7, 'second_hand_item_received', 'Article recu', 'Votre article a ete recu.', '{\"proposal_id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\"}', 1, '2026-08-31 05:11:15', '2026-08-31 03:11:11'),
(9, 7, 'second_hand_completed', 'Mise a jour proposition', 'Le statut de votre proposition seconde main a ete mis a jour.', '{\"proposal_id\":1,\"proposal_number\":\"SHP-1788143468881-53359C\"}', 1, '2026-08-31 05:11:35', '2026-08-31 03:11:26');

-- --------------------------------------------------------

--
-- Structure de la table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `fulfillment_type` enum('delivery','pickup') NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `beneficiary_name` varchar(200) DEFAULT NULL,
  `beneficiary_phone` varchar(50) DEFAULT NULL,
  `pickup_code_hash` varchar(255) DEFAULT NULL,
  `pickup_qr_token_hash` varchar(255) DEFAULT NULL,
  `shipping_name` varchar(200) DEFAULT NULL,
  `shipping_phone` varchar(50) DEFAULT NULL,
  `shipping_address_line_1` varchar(255) DEFAULT NULL,
  `shipping_address_line_2` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(150) DEFAULT NULL,
  `shipping_province` varchar(150) DEFAULT NULL,
  `shipping_postal_code` varchar(30) DEFAULT NULL,
  `shipping_country_code` char(2) DEFAULT NULL,
  `shipping_carrier` varchar(150) DEFAULT NULL,
  `shipping_tracking_number` varchar(255) DEFAULT NULL,
  `subtotal_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rental_deposit_total_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `shipping_total_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount_total_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `paid_total_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `refunded_total_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `exchange_rate_eur_to_aoa` decimal(18,6) NOT NULL,
  `total_aoa` decimal(18,2) NOT NULL,
  `resell_to_company` tinyint(1) NOT NULL DEFAULT 0,
  `payment_status` enum('unpaid','partially_paid','paid','partially_refunded','refunded','failed') NOT NULL DEFAULT 'unpaid',
  `status` enum('pending_payment','confirmed','processing','ready_for_pickup','shipped','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
  `customer_notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `fulfillment_type`, `branch_id`, `beneficiary_name`, `beneficiary_phone`, `pickup_code_hash`, `pickup_qr_token_hash`, `shipping_name`, `shipping_phone`, `shipping_address_line_1`, `shipping_address_line_2`, `shipping_city`, `shipping_province`, `shipping_postal_code`, `shipping_country_code`, `shipping_carrier`, `shipping_tracking_number`, `subtotal_eur`, `rental_deposit_total_eur`, `shipping_total_eur`, `discount_total_eur`, `total_eur`, `paid_total_eur`, `refunded_total_eur`, `exchange_rate_eur_to_aoa`, `total_aoa`, `resell_to_company`, `payment_status`, `status`, `customer_notes`, `admin_notes`, `paid_at`, `shipped_at`, `completed_at`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(1, 'AKF-2026-000001', 4, 'pickup', 1, 'Marie Kiala', '+244923555001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 149.90, 0.00, 0.00, 0.00, 149.90, 149.90, 0.00, 1000.000000, 149900.00, 0, 'paid', 'completed', NULL, NULL, '2026-07-31 16:48:22', NULL, '2026-08-02 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(2, 'AKF-2026-000002', 5, 'pickup', 2, 'Carlos Miguel', '+244923200001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 135.00, 200.00, 0.00, 0.00, 335.00, 335.00, 0.00, 1000.000000, 335000.00, 0, 'paid', 'confirmed', NULL, NULL, '2026-08-10 16:48:22', NULL, NULL, NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 'ORD-20260813212141-69B5FE', 7, 'pickup', NULL, 'Ana Kiala', '+244 912 345 678', '3464d8745481b0fa8d2ae38bf20e397b4801d83c28ee6fb5134193412b5a98a2', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 649.70, 0.00, 0.00, 0.00, 649.70, 649.70, 0.00, 1000.000000, 649700.00, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-13 23:21:43', NULL, NULL, NULL, '2026-08-13 21:21:41', '2026-08-18 22:14:31'),
(4, 'ORD-20260813213036-2A6622', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', 'ad806755e82f2b92789e7d90c9d988e00c9e7d3e3def89491b11438e4acce739', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 349.80, 0.00, 0.00, 0.00, 354.80, 354.80, 0.00, 1000.000000, 354800.00, 0, 'paid', '', NULL, NULL, '2026-08-13 23:31:05', NULL, NULL, NULL, '2026-08-13 21:30:36', '2026-08-13 21:31:05'),
(5, 'ORD-20260813215414-C873D6', 7, 'delivery', 3, 'Ana Kiala', '+244 912 345 678', '7d36c27670495a9bca119445b1c632f3602810742b3ccf690fb626f3ccd0be45', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 709.90, 0.00, 0.00, 0.00, 714.90, 714.90, 0.00, 1000.000000, 714900.00, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-13 23:54:28', NULL, NULL, NULL, '2026-08-13 21:54:14', '2026-08-18 22:14:31'),
(6, 'ORD-20260814061430-8DCB89', 7, 'delivery', 3, 'Ana Kiala', '+244 912 345 678', '9bb612633ba25914ae922ec4faa0855e6ce5ad680a828f118621d4fcdc305ac5', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 89.90, 0.00, 0.00, 0.00, 94.90, 0.00, 0.00, 1000.000000, 94900.00, 0, '', 'completed', NULL, NULL, NULL, NULL, '2026-08-15 15:03:05', NULL, '2026-08-14 06:14:30', '2026-08-15 13:03:05'),
(7, 'ORD-20260814062636-6FF8EC', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '748917efd0f77797e7fc49d1e0e9de96ea9d34e723aead0451bb2bdb2b72bf9c', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', '', '', '', '', 'AO', '', '', 199.90, 0.00, 0.00, 0.00, 204.90, 204.90, 0.00, 1000.000000, 204900.00, 0, 'paid', 'completed', '', '', '2026-08-14 08:26:36', NULL, '2026-08-15 10:10:50', NULL, '2026-08-14 06:26:36', '2026-08-15 08:10:50'),
(8, 'ORD-20260815132058-1E7494', 6, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '915cf777e7687de0b721d8e3dec9af57f8fd9deeadee607f00a464cbbdbb5276', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 599.80, 0.00, 0.00, 0.00, 604.80, 604.80, 0.00, 1625.000000, 982800.00, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-15 15:21:07', NULL, NULL, NULL, '2026-08-15 13:20:58', '2026-08-18 22:14:31'),
(9, 'ORD-20260815141445-D395C8', 6, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '02d9d514b348218298d98d7337fd2e8b59cf620637f213225b81b2c78686fe65', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 299.90, 0.00, 0.00, 0.00, 299.90, 299.90, 0.00, 1625.000000, 487337.50, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-15 16:14:53', NULL, NULL, NULL, '2026-08-15 14:14:45', '2026-08-18 22:14:31'),
(10, 'ORD-20260818210151-9DD37F', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '0534f0cc06348c0b8a52e46bb373656f498a1cba3330d7b888256743ab1c55ad', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 199.90, 0.00, 0.00, 0.00, 204.90, 0.00, 0.00, 1625.000000, 332962.50, 0, '', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-18 21:01:51', '2026-08-18 21:01:51'),
(11, 'ORD-20260818214659-65FDF0', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '5709ecf7768f45d4a5db03c1458a0bc84de8f03358acf6cf90a1dc7368b5f4ab', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 289.80, 0.00, 0.00, 0.00, 294.80, 0.00, 0.00, 1625.000000, 479050.00, 0, '', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-18 21:46:59', '2026-08-18 21:46:59'),
(12, 'ORD-20260818215142-279B6F', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '4f1103fc7ff011ff4ea74ecccd0fb98361e14c6603e8129d0f6cb690632aca16', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 199.90, 0.00, 0.00, 0.00, 204.90, 204.90, 0.00, 1625.000000, 332962.50, 0, 'paid', '', NULL, NULL, '2026-08-18 23:52:00', NULL, NULL, NULL, '2026-08-18 21:51:42', '2026-08-18 21:52:00'),
(13, 'ORD-20260818215529-A291C4', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', 'fe331f75cca2819cf48b72c8c0cecec12cef9782523eb981d5cfe04c9f12d12b', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 89.90, 0.00, 0.00, 0.00, 89.90, 89.90, 0.00, 1625.000000, 146087.50, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-18 23:57:10', NULL, NULL, NULL, '2026-08-18 21:55:29', '2026-08-18 22:14:31'),
(14, 'ORD-20260818215806-81154C', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', 'a96ca65846704d81bae36e22a26ce4337d969361e6ef4c179df3bc17d7b9c1e2', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 290.00, 0.00, 0.00, 0.00, 295.00, 295.00, 0.00, 1625.000000, 479375.00, 0, 'paid', '', NULL, NULL, '2026-08-18 23:58:32', NULL, NULL, NULL, '2026-08-18 21:58:06', '2026-08-18 21:58:32'),
(15, 'ORD-20260818215851-E5E304', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '03530f47ce378a2c3657a15c2764c7cd5ce7e43cefab521ab77b0a9a421f9384', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 179.80, 0.00, 0.00, 0.00, 179.80, 179.80, 0.00, 1625.000000, 292175.00, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-18 23:59:08', NULL, NULL, NULL, '2026-08-18 21:58:51', '2026-08-18 22:14:31'),
(16, 'ORD-20260821095153-915C7E', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '4aa75a15b2c67566fe518a9cbb5709e179f2dcfec0261ee2733812fa12098745', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 604.80, 0.00, 0.00, 0.00, 609.80, 609.80, 0.00, 1625.000000, 990925.00, 0, 'paid', '', NULL, NULL, '2026-08-21 11:51:53', NULL, NULL, NULL, '2026-08-21 09:51:53', '2026-08-21 09:51:53'),
(17, 'ORD-20260821103608-7696F3', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '1b9c0b4a49a2f1a07773609da6d531112b76d062b446b6d057d1c0fe5f2ae546', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 499.80, 0.00, 0.00, 0.00, 504.80, 0.00, 0.00, 1625.000000, 820300.00, 0, 'unpaid', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-21 10:36:08', '2026-08-21 10:36:08'),
(18, 'ORD-20260821103618-54748B', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', 'efad0f27fb0335c5cfd6e87b7dd9f754c5130eb5d13b1377c5b137be52f8376c', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 499.80, 0.00, 0.00, 0.00, 504.80, 100.00, 0.00, 1625.000000, 820300.00, 0, 'partially_paid', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-21 10:36:18', '2026-08-21 10:36:18'),
(19, 'ORD-20260821103655-0CA852', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '3b9f7673a42505faf7b7abaad29946ca5098fb95cd895d5ee47217cadd293a61', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 834.80, 0.00, 0.00, 0.00, 839.80, 785.30, 0.00, 1625.000000, 1364675.00, 0, 'partially_paid', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-21 10:36:55', '2026-08-21 10:36:55'),
(20, 'ORD-20260821110110-B92B6A', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '6a52f5e96a546355a07b61950e4e59e58e77357c1aaedadd0a7ac92c3efc2f49', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1734.50, 0.00, 0.00, 0.00, 1739.50, 0.00, 0.00, 1625.000000, 2826687.50, 0, 'failed', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-21 11:01:10', '2026-08-21 11:01:12'),
(21, 'ORD-20260821110127-60050C', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '444033f5a33876560201f2b4382623eec1898ee3f43a0980ce70711be17d5435', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1734.50, 0.00, 0.00, 0.00, 1739.50, 1739.50, 0.00, 1625.000000, 2826687.50, 0, 'paid', '', NULL, NULL, '2026-08-21 13:01:46', NULL, NULL, NULL, '2026-08-21 11:01:27', '2026-08-21 11:01:46'),
(22, 'ORD-20260827105617-0EC83C', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '6694133c2cd2ffd72bd353c836f67de058fe9a6b736684fe5d3d65f35460e8a4', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 79.90, 0.00, 0.00, 0.00, 79.90, 79.90, 0.00, 1625.000000, 129837.50, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-27 12:56:44', NULL, NULL, NULL, '2026-08-27 10:56:17', '2026-08-27 10:56:44'),
(23, 'ORD-20260827105939-F91689', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '85743f73575e7bbcd190deb1192342843d73280222cebcfc1c1024b5534d9060', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 159.80, 0.00, 0.00, 0.00, 159.80, 159.80, 0.00, 1625.000000, 259675.00, 1, 'paid', '', 'Client requested company resale payout at counter.', NULL, '2026-08-27 13:00:37', NULL, NULL, NULL, '2026-08-27 10:59:39', '2026-08-27 11:00:37'),
(24, 'ORD-20260827121606-C97CC8', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '0b2a908d4ce795d1151b9e8b10b0c65ac30c9f00e954cedcc19917df82ce86c7', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 199.90, 0.00, 0.00, 0.00, 204.90, 0.00, 0.00, 1270.000000, 260223.00, 0, 'failed', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-27 12:16:06', '2026-08-27 12:16:19'),
(25, 'ORD-20260828150423-035645', 8, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', '3d4d7fcebe17df42d997902f34b332a3748235c197c61fa1aec36d69f2fed9f1', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', '', '', '', '', 'BE', '', '', 2089.70, 0.00, 10.00, 0.00, 2099.70, 2099.70, 0.00, 1270.000000, 2666619.00, 0, 'paid', 'shipped', '', '', '2026-08-28 17:04:30', '2026-08-28 17:05:14', '2026-08-28 17:04:58', NULL, '2026-08-28 15:04:23', '2026-08-28 15:05:14'),
(26, 'ORD-20260828152118-A85D3D', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', 'eb381dc8154b6d6a2f8825aa62d610be5703d82d24b2bc1702d92af035366ab3', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, 'BE', NULL, NULL, 3000.00, 0.00, 10.00, 0.00, 3010.00, 0.00, 0.00, 1270.000000, 3822700.00, 0, 'failed', '', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-28 15:21:18', '2026-08-28 15:21:32'),
(27, 'ORD-20260828152317-4B6304', 7, 'delivery', NULL, 'Ana Kiala', '+244 912 345 678', 'ebf3844c9596e90664f4922348a9e9a6d07fa4cf06c4d80c5e6c04d8c6e3b895', NULL, 'Ana Kiala', '+244 912 345 678', 'Rua Rainha Ginga, No 23', NULL, NULL, NULL, NULL, 'BE', NULL, NULL, 3000.00, 0.00, 10.00, 0.00, 3010.00, 3010.00, 0.00, 1270.000000, 3822700.00, 0, 'paid', '', NULL, NULL, '2026-08-28 17:23:31', NULL, NULL, NULL, '2026-08-28 15:23:17', '2026-08-28 15:23:31');

-- --------------------------------------------------------

--
-- Structure de la table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `product_variant_id` bigint(20) UNSIGNED NOT NULL,
  `item_type` enum('purchase','rental') NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `color` varchar(100) DEFAULT NULL,
  `condition_type` enum('new','second_hand') NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price_eur` decimal(12,2) NOT NULL,
  `line_total_eur` decimal(12,2) NOT NULL,
  `resell_to_company` tinyint(1) NOT NULL DEFAULT 0,
  `rental_start_date` date DEFAULT NULL,
  `rental_end_date` date DEFAULT NULL,
  `rental_days` int(10) UNSIGNED DEFAULT NULL,
  `rental_price_per_day_eur` decimal(12,2) DEFAULT NULL,
  `rental_deposit_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rental_status` enum('not_applicable','reserved','ready_for_pickup','active','return_due','overdue','returned','damaged','lost','cancelled') NOT NULL DEFAULT 'not_applicable',
  `rental_picked_up_at` datetime DEFAULT NULL,
  `rental_returned_at` datetime DEFAULT NULL,
  `rental_late_fee_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rental_damage_fee_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rental_return_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_variant_id`, `item_type`, `product_name`, `sku`, `size`, `color`, `condition_type`, `quantity`, `unit_price_eur`, `line_total_eur`, `resell_to_company`, `rental_start_date`, `rental_end_date`, `rental_days`, `rental_price_per_day_eur`, `rental_deposit_eur`, `rental_status`, `rental_picked_up_at`, `rental_returned_at`, `rental_late_fee_eur`, `rental_damage_fee_eur`, `rental_return_notes`, `created_at`) VALUES
(1, 1, 1, 2, 'purchase', 'Robe Élégance Noire', 'AKF-DRESS-001-M', 'M', 'Noir', 'new', 1, 149.90, 149.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-10 14:48:22'),
(2, 2, 3, 6, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 45.00, 135.00, 0, '2026-08-10', '2026-08-12', 3, 45.00, 200.00, 'returned', NULL, '2026-08-15 05:09:41', 0.00, 0.00, 'Mise a jour admin: Retournee', '2026-08-10 14:48:22'),
(3, 3, 1, 2, 'purchase', 'Robe Élégance Noire', 'AKF-DRESS-001-M', 'M', 'Noir', 'new', 1, 149.90, 149.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:21:41'),
(4, 3, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:21:41'),
(5, 3, 3, 6, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 299.90, 299.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:21:41'),
(6, 4, 1, 2, 'purchase', 'Robe Élégance Noire', 'AKF-DRESS-001-M', 'M', 'Noir', 'new', 1, 149.90, 149.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:30:36'),
(7, 4, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:30:36'),
(8, 5, 1, 2, 'rental', 'Robe Élégance Noire', 'AKF-DRESS-001-M', 'M', 'Noir', 'new', 1, 25.00, 175.00, 0, '2026-08-28', '2026-08-30', 3, 25.00, 100.00, 'reserved', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:54:14'),
(9, 5, 3, 6, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 45.00, 335.00, 0, '2026-08-13', '2026-08-15', 3, 45.00, 200.00, 'returned', '2026-08-15 15:11:16', '2026-08-15 15:11:49', 0.00, 0.00, NULL, '2026-08-13 21:54:14'),
(10, 5, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-13 21:54:14'),
(11, 6, 4, 8, 'purchase', 'Sac Luxury Beige', 'AKF-BAG-001-STD', NULL, 'Beige', 'new', 1, 89.90, 89.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-14 06:14:30'),
(12, 7, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-14 06:26:36'),
(13, 8, 3, 6, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 299.90, 299.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-15 13:20:58'),
(14, 8, 3, 6, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 299.90, 299.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-15 13:20:58'),
(15, 9, 3, 6, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 299.90, 299.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-15 14:14:45'),
(16, 10, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:01:51'),
(17, 11, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:46:59'),
(18, 11, 4, 8, 'purchase', 'Sac Luxury Beige', 'AKF-BAG-001-STD', NULL, 'Beige', 'new', 1, 89.90, 89.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:46:59'),
(19, 12, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:51:42'),
(20, 13, 4, 8, 'purchase', 'Sac Luxury Beige', 'AKF-BAG-001-STD', NULL, 'Beige', 'new', 1, 89.90, 89.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:55:29'),
(21, 14, 3, 6, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 45.00, 290.00, 0, '2026-08-18', '2026-08-20', 2, 45.00, 200.00, 'reserved', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:58:06'),
(22, 15, 4, 8, 'purchase', 'Sac Luxury Beige', 'AKF-BAG-001-STD', NULL, 'Beige', 'new', 2, 89.90, 179.80, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-18 21:58:51'),
(23, 16, 3, 6, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 45.00, 425.00, 0, '2026-08-21', '2026-08-26', 5, 45.00, 200.00, 'reserved', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 09:51:53'),
(24, 16, 4, 8, 'purchase', 'Sac Luxury Beige', 'AKF-BAG-001-STD', NULL, 'Beige', 'new', 2, 89.90, 179.80, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 09:51:53'),
(25, 17, 3, 7, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 1, 299.90, 299.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:08'),
(26, 17, 2, 5, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-L', 'L', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:08'),
(27, 18, 3, 7, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 1, 299.90, 299.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:18'),
(28, 18, 2, 5, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-L', 'L', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:18'),
(29, 19, 3, 7, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 1, 45.00, 335.00, 0, '2026-08-21', '2026-08-24', 3, 45.00, 200.00, 'reserved', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:55'),
(30, 19, 3, 7, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 1, 299.90, 299.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:55'),
(31, 19, 2, 5, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-L', 'L', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 10:36:55'),
(32, 20, 3, 7, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 1, 45.00, 335.00, 0, '2026-08-21', '2026-08-24', 3, 45.00, 200.00, 'reserved', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 11:01:10'),
(33, 20, 3, 7, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 4, 299.90, 1199.60, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 11:01:10'),
(34, 20, 2, 5, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-L', 'L', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 11:01:10'),
(35, 21, 3, 7, 'rental', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 1, 45.00, 335.00, 0, '2026-08-21', '2026-08-24', 3, 45.00, 200.00, 'reserved', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 11:01:27'),
(36, 21, 3, 7, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-L', 'L', 'Noir', 'new', 4, 299.90, 1199.60, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 11:01:27'),
(37, 21, 2, 5, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-L', 'L', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-21 11:01:27'),
(38, 22, 6, 11, 'purchase', 'Robe Vintage Seconde Main', 'AKF-DRESS-003-M', 'M', 'Bleu', 'second_hand', 1, 79.90, 79.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-27 10:56:17'),
(39, 23, 6, 11, 'purchase', 'Robe Vintage Seconde Main', 'AKF-DRESS-003-M', 'M', 'Bleu', 'second_hand', 1, 79.90, 79.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-27 10:59:39'),
(40, 23, 6, 11, 'purchase', 'Robe Vintage Seconde Main', 'AKF-DRESS-003-M', 'M', 'Bleu', 'second_hand', 1, 79.90, 79.90, 1, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-27 10:59:39'),
(41, 24, 2, 5, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-L', 'L', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-27 12:16:06'),
(42, 25, 4, 8, 'purchase', 'Sac Luxury Beige', 'AKF-BAG-001-STD', NULL, 'Beige', 'new', 1, 89.90, 89.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-28 15:04:23'),
(43, 25, 3, 6, 'purchase', 'Costume Premium Noir', 'AKF-SUIT-001-M', 'M', 'Noir', 'new', 1, 299.90, 299.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-28 15:04:23'),
(44, 25, 2, 4, 'purchase', 'Robe Royale Rouge', 'AKF-DRESS-002-M', 'M', 'Rouge', 'new', 1, 199.90, 199.90, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-28 15:04:23'),
(45, 25, 8, 12, 'purchase', 'TTTTTTTT', 'PK-4582-STD', 'Unique', NULL, 'second_hand', 1, 1500.00, 1500.00, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-28 15:04:23'),
(46, 26, 8, 12, 'purchase', 'TTTTTTTT', 'PK-4582-STD', 'Unique', NULL, 'second_hand', 2, 1500.00, 3000.00, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-28 15:21:18'),
(47, 27, 8, 12, 'purchase', 'TTTTTTTT', 'PK-4582-STD', 'Unique', NULL, 'second_hand', 2, 1500.00, 3000.00, 0, NULL, NULL, NULL, NULL, 0.00, 'not_applicable', NULL, NULL, 0.00, 0.00, NULL, '2026-08-28 15:23:17');

-- --------------------------------------------------------

--
-- Structure de la table `order_pickups`
--

CREATE TABLE `order_pickups` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED NOT NULL,
  `cashier_id` bigint(20) UNSIGNED NOT NULL,
  `pickup_type` enum('purchase','rental','rental_return') NOT NULL,
  `beneficiary_name` varchar(200) NOT NULL,
  `beneficiary_phone` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `completed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `notes` text DEFAULT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `order_status_history`
--

INSERT INTO `order_status_history` (`id`, `order_id`, `old_status`, `new_status`, `notes`, `changed_by`, `created_at`) VALUES
(1, 1, 'pending_payment', 'confirmed', 'Paiement confirmé.', 1, '2026-08-10 14:48:22'),
(2, 1, 'confirmed', 'completed', 'Commande remise au bénéficiaire.', 2, '2026-08-10 14:48:22'),
(3, 2, 'pending_payment', 'confirmed', 'Location confirmée.', 1, '2026-08-10 14:48:22'),
(4, 7, '', 'pending_payment', NULL, 8, '2026-08-15 02:48:18'),
(5, 7, 'pending_payment', 'processing', NULL, 8, '2026-08-15 02:48:28'),
(6, 7, 'processing', 'completed', NULL, 8, '2026-08-15 08:10:50'),
(7, 6, '', 'shipped', 'Action guichet: Expediee', 6, '2026-08-15 13:02:51'),
(8, 6, 'shipped', 'completed', 'Action guichet: Terminee', 6, '2026-08-15 13:03:05'),
(9, 25, '', 'completed', NULL, 8, '2026-08-28 15:04:58'),
(10, 25, 'completed', 'shipped', NULL, 8, '2026-08-28 15:05:14');

-- --------------------------------------------------------

--
-- Structure de la table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payment_reference` varchar(100) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `gift_card_id` bigint(20) UNSIGNED DEFAULT NULL,
  `purpose` enum('order','gift_card_purchase','rental_fee','rental_deposit','rental_late_fee','rental_damage_fee','other') NOT NULL,
  `method` enum('stripe','gift_card') NOT NULL,
  `amount_eur` decimal(12,2) NOT NULL,
  `status` enum('pending','reserved','requires_action','succeeded','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL,
  `stripe_checkout_session_id` varchar(255) DEFAULT NULL,
  `stripe_charge_id` varchar(255) DEFAULT NULL,
  `stripe_refund_id` varchar(255) DEFAULT NULL,
  `failure_message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `succeeded_at` datetime DEFAULT NULL,
  `refunded_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `payments`
--

INSERT INTO `payments` (`id`, `payment_reference`, `user_id`, `order_id`, `gift_card_id`, `purpose`, `method`, `amount_eur`, `status`, `stripe_payment_intent_id`, `stripe_checkout_session_id`, `stripe_charge_id`, `stripe_refund_id`, `failure_message`, `metadata`, `succeeded_at`, `refunded_at`, `created_at`, `updated_at`) VALUES
(1, 'PAY-DEMO-000001', 4, 1, NULL, 'order', 'stripe', 149.90, 'succeeded', 'pi_demo_akf_000001', NULL, NULL, NULL, NULL, NULL, '2026-07-31 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(2, 'PAY-DEMO-000002', 5, 2, NULL, 'order', 'stripe', 335.00, 'succeeded', 'pi_demo_akf_000002', NULL, NULL, NULL, NULL, NULL, '2026-08-10 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 'PAY-20260813212143-49E8DE', 7, 3, NULL, 'order', 'stripe', 649.70, 'succeeded', 'pi_3U464HRuOcC0F31Z1zpV7kmH', NULL, NULL, NULL, NULL, '{\"order_id\":\"3\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-13 23:21:43', NULL, '2026-08-13 21:21:43', '2026-08-13 21:21:43'),
(4, 'PAY-20260813213036-3548E8', 7, 4, NULL, 'order', 'stripe', 354.80, 'succeeded', 'pi_3U46DKRuOcC0F31Z1AMoxn0G', 'cs_test_a1XMesXGvmCvZGRCHNkrq7hkb56BEdKsBnPjZXzo3FE0jYMIGaZPNJtJg2', NULL, NULL, NULL, '{\"order_id\":\"4\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-13 23:31:05', NULL, '2026-08-13 21:30:36', '2026-08-13 21:31:05'),
(5, 'PAY-20260813215415-13A196', 7, 5, NULL, 'order', 'stripe', 714.90, 'succeeded', 'pi_3U46ZwRuOcC0F31Z18LwpKWj', 'cs_test_a1WlAxCEpmiJDkNxhQdUU9LCNA1DXQw8Vt8LTNshd75on274H9cBcdnY0O', NULL, NULL, NULL, '{\"order_id\":\"5\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-13 23:54:28', NULL, '2026-08-13 21:54:15', '2026-08-13 21:54:28'),
(6, 'PAY-20260814061318-36329E', 7, NULL, 4, 'gift_card_purchase', 'stripe', 100.00, 'succeeded', 'pi_3U4EN2RuOcC0F31Z0Od76V6S', 'cs_test_a1KapSF4qaTChgyGYr5irnmDrqXNj1kWPSAjFWo6Uk7ksgyGWcDKw6RiND', NULL, NULL, NULL, '{\"gift_card_id\":\"4\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', '2026-08-14 08:13:39', NULL, '2026-08-14 06:13:18', '2026-08-14 06:13:39'),
(7, 'PAY-20260814061503-7B9AA9', 7, NULL, 5, 'gift_card_purchase', 'stripe', 300.00, 'succeeded', 'pi_3U4EOkRuOcC0F31Z14MvItrP', 'cs_test_a1awyvA8ZHOnmG55SF3SJWSbuaSXM8zLF46joh0HILvGZHGRsbZqam9yOD', NULL, NULL, NULL, '{\"gift_card_id\":\"5\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', '2026-08-14 08:15:25', NULL, '2026-08-14 06:15:03', '2026-08-14 06:15:25'),
(8, 'PAY-20260814062505-9FEFFD', 7, NULL, 6, 'gift_card_purchase', 'stripe', 300.00, 'succeeded', 'pi_3U4EYKRuOcC0F31Z0dH3pYH0', 'cs_test_a1jfaGVHgxfuEkBOdoHQL2P7bLmpvhYtQjzU1nbr88Bvv3sjIxF5onLjev', NULL, NULL, NULL, '{\"gift_card_id\":\"6\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', '2026-08-14 08:25:19', NULL, '2026-08-14 06:25:06', '2026-08-14 06:25:19'),
(9, 'PAY-20260814062636-25440E', 7, 7, 6, 'order', 'gift_card', 204.90, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"customer_gift_card\"}', NULL, NULL, '2026-08-14 06:26:36', '2026-08-14 06:26:36'),
(10, 'PAY-20260815132059-FB6BBD', 6, 8, NULL, 'order', 'stripe', 604.80, 'succeeded', 'pi_3U4hWGRuOcC0F31Z1wxSlbJS', 'cs_test_a1pvWl1bE5xdV1ZbCmwGOEnbR9wLtHSHEb9VZTD7vlxXQGUmngGI5t71S3', NULL, NULL, NULL, '{\"order_id\":\"8\",\"purpose\":\"order\",\"user_id\":\"6\"}', '2026-08-15 15:21:07', NULL, '2026-08-15 13:20:59', '2026-08-15 13:21:07'),
(11, 'PAY-20260815141446-58C15F', 6, 9, NULL, 'order', 'stripe', 299.90, 'succeeded', 'pi_3U4iMHRuOcC0F31Z0blOqfuS', 'cs_test_a19FoMnKQbxOEdLmY9Duc6RyC8GBBXHqgDnd3725RCCjCYWnDVbCfDS4MP', NULL, NULL, NULL, '{\"order_id\":\"9\",\"purpose\":\"order\",\"user_id\":\"6\"}', '2026-08-15 16:14:53', NULL, '2026-08-15 14:14:46', '2026-08-15 14:14:53'),
(12, 'PAY-20260818210152-CCC3B0', 7, 10, NULL, 'order', 'stripe', 204.90, 'pending', NULL, 'cs_test_a1UVhRi8KS56SOek5iMlI8Kh2jj2qwymLKGTd4xrs80CtKX5TnydI9dwYc', NULL, NULL, NULL, '{\"order_id\":\"10\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-18 21:01:52', '2026-08-18 21:01:52'),
(13, 'PAY-20260818214700-2D64E0', 7, 11, NULL, 'order', 'stripe', 294.80, 'pending', 'pi_3U5uqWRuOcC0F31Z0ychNToC', NULL, NULL, NULL, NULL, '{\"order_id\":\"11\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-18 21:47:00', '2026-08-18 21:47:00'),
(14, 'PAY-20260818215143-768065', 7, 12, NULL, 'order', 'stripe', 204.90, 'succeeded', 'pi_3U5uv4RuOcC0F31Z1VFbnwyL', NULL, NULL, NULL, NULL, '{\"order_id\":\"12\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-18 23:52:00', NULL, '2026-08-18 21:51:43', '2026-08-18 21:52:00'),
(15, 'PAY-20260818215529-B386DA', 7, 13, NULL, 'order', 'stripe', 89.90, 'succeeded', 'pi_3U5uyjRuOcC0F31Z0mlMLIaH', NULL, NULL, NULL, NULL, '{\"order_id\":\"13\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-18 23:57:10', NULL, '2026-08-18 21:55:29', '2026-08-18 21:57:10'),
(16, 'PAY-20260818215807-AF3662', 7, 14, NULL, 'order', 'stripe', 295.00, 'succeeded', 'pi_3U5v1GRuOcC0F31Z1kbcKxXF', NULL, NULL, NULL, NULL, '{\"order_id\":\"14\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-18 23:58:32', NULL, '2026-08-18 21:58:07', '2026-08-18 21:58:32'),
(17, 'PAY-20260818215852-C636EF', 7, 15, NULL, 'order', 'stripe', 179.80, 'succeeded', 'pi_3U5v20RuOcC0F31Z0rFymwKS', NULL, NULL, NULL, NULL, '{\"order_id\":\"15\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-18 23:59:08', NULL, '2026-08-18 21:58:52', '2026-08-18 21:59:08'),
(18, 'PAY-20260821073359-B0F1F6', 8, NULL, 7, 'gift_card_purchase', 'stripe', 200.00, 'pending', NULL, 'cs_test_a1MaeYTuFeMSiZ7lBXO4YMPd1ED2DWneViCFFqXhknkBSifAheMpkYsb9B', NULL, NULL, NULL, '{\"gift_card_id\":\"7\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"8\"}', NULL, NULL, '2026-08-21 07:33:59', '2026-08-21 07:33:59'),
(19, 'PAY-20260821082651-B2E39F', 7, NULL, 8, 'gift_card_purchase', 'stripe', 1000.00, 'succeeded', 'pi_3U6nmoRuOcC0F31Z10Ban8U5', NULL, NULL, NULL, NULL, '{\"gift_card_id\":\"8\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', '2026-08-21 10:27:15', NULL, '2026-08-21 08:26:51', '2026-08-21 08:27:15'),
(20, 'PAY-20260821095153-47DDCF', 7, 16, 6, 'order', 'gift_card', 95.10, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260814062505-DAB234\"}', NULL, NULL, '2026-08-21 09:51:53', '2026-08-21 09:51:53'),
(21, 'PAY-20260821095153-FD7CA3', 7, 16, 5, 'order', 'gift_card', 300.00, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260814061502-99E2DE\"}', NULL, NULL, '2026-08-21 09:51:53', '2026-08-21 09:51:53'),
(22, 'PAY-20260821095153-F4A4EE', 7, 16, 8, 'order', 'gift_card', 214.70, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260821082650-7A14E1\"}', NULL, NULL, '2026-08-21 09:51:53', '2026-08-21 09:51:53'),
(23, 'PAY-20260821103608-C38E49', 7, 17, NULL, 'order', 'stripe', 504.80, 'pending', 'pi_3U6pnwRuOcC0F31Z07wE5k2A', NULL, NULL, NULL, NULL, '{\"order_id\":\"17\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-21 10:36:08', '2026-08-21 10:36:08'),
(24, 'PAY-20260821103618-25F9E7', 7, 18, 4, 'order', 'gift_card', 100.00, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260814061318-6ECFF1\"}', NULL, NULL, '2026-08-21 10:36:18', '2026-08-21 10:36:18'),
(25, 'PAY-20260821103618-2CF256', 7, 18, NULL, 'order', 'stripe', 404.80, 'pending', 'pi_3U6po6RuOcC0F31Z1scW8xYN', NULL, NULL, NULL, NULL, '{\"order_id\":\"18\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-21 10:36:18', '2026-08-21 10:36:18'),
(26, 'PAY-20260821103655-10A0AB', 7, 19, 8, 'order', 'gift_card', 785.30, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260821082650-7A14E1\"}', NULL, NULL, '2026-08-21 10:36:55', '2026-08-21 10:36:55'),
(27, 'PAY-20260821103655-FA653F', 7, 19, NULL, 'order', 'stripe', 54.50, 'pending', 'pi_3U6pohRuOcC0F31Z0P8Es3hJ', NULL, NULL, NULL, NULL, '{\"order_id\":\"19\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-21 10:36:55', '2026-08-21 10:36:55'),
(28, 'PAY-20260821105832-A346DD', 7, NULL, 9, 'gift_card_purchase', 'stripe', 500.00, 'pending', 'pi_3U6q9cRuOcC0F31Z1CIKRMhd', NULL, NULL, NULL, NULL, '{\"gift_card_id\":\"9\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-21 10:58:32', '2026-08-21 10:58:32'),
(29, 'PAY-20260821110002-4A6544', 7, NULL, 10, 'gift_card_purchase', 'stripe', 1000.00, 'succeeded', 'pi_3U6qB4RuOcC0F31Z0NUpxuvj', NULL, NULL, NULL, NULL, '{\"gift_card_id\":\"10\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', '2026-08-21 13:00:27', NULL, '2026-08-21 11:00:02', '2026-08-21 11:00:27'),
(30, 'PAY-20260821110110-69A05C', 7, 20, 10, 'order', 'gift_card', 1000.00, 'cancelled', NULL, NULL, NULL, NULL, 'Paiement Stripe annule par le client', '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260821110002-5525E6\",\"reserved_until_stripe_confirmation\":true}', NULL, NULL, '2026-08-21 11:01:10', '2026-08-21 11:01:12'),
(31, 'PAY-20260821110110-8AA027', 7, 20, NULL, 'order', 'stripe', 739.50, 'pending', 'pi_3U6qCARuOcC0F31Z0aVsFVx6', NULL, NULL, NULL, NULL, '{\"order_id\":\"20\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-21 11:01:10', '2026-08-21 11:01:10'),
(32, 'PAY-20260821110127-972178', 7, 21, 10, 'order', 'gift_card', 1000.00, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260821110002-5525E6\",\"reserved_until_stripe_confirmation\":true}', '2026-08-21 13:01:46', NULL, '2026-08-21 11:01:27', '2026-08-21 11:01:46'),
(33, 'PAY-20260821110127-A064E6', 7, 21, NULL, 'order', 'stripe', 739.50, 'succeeded', 'pi_3U6qCRRuOcC0F31Z0herrsOu', NULL, NULL, NULL, NULL, '{\"order_id\":\"21\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-21 13:01:46', NULL, '2026-08-21 11:01:27', '2026-08-21 11:01:46'),
(34, 'PAY-20260827105618-28E46D', 7, 22, NULL, 'order', 'stripe', 79.90, 'succeeded', 'pi_3U90z5RuOcC0F31Z1l5evFYx', 'cs_test_a1bzAjfzvCH8WeO5MRH4HIknIjW2U0aVKN4JOZgeDa8WJBaz1jlp1pv6iG', NULL, NULL, NULL, '{\"order_id\":\"22\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-27 12:56:44', NULL, '2026-08-27 10:56:18', '2026-08-27 10:56:44'),
(35, 'PAY-20260827105940-A9A18C', 7, 23, NULL, 'order', 'stripe', 159.80, 'succeeded', 'pi_3U912pRuOcC0F31Z1ohraB5L', 'cs_test_a1zWZN0k8J05YVYjc4Hl7mS6Lll25r214q5MptOVqJwic2Bm02mxo10lE8', NULL, NULL, NULL, '{\"order_id\":\"23\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-27 13:00:38', NULL, '2026-08-27 10:59:40', '2026-08-27 11:00:38'),
(36, 'PAY-20260827121607-98D668', 7, 24, NULL, 'order', 'stripe', 204.90, 'pending', 'pi_3U92DyRuOcC0F31Z0MpDCzy9', NULL, NULL, NULL, NULL, '{\"order_id\":\"24\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-27 12:16:07', '2026-08-27 12:16:07'),
(37, 'PAY-20260828150423-21056E', 8, 25, NULL, 'order', 'stripe', 2099.70, 'succeeded', 'pi_3U9RKSRuOcC0F31Z18V8LINr', 'cs_test_a1He0pQChlDXK5cCE72iZkiDn5yAk090pvhRh8rW7YgjLJPQnhnihSbwGJ', NULL, NULL, NULL, '{\"order_id\":\"25\",\"purpose\":\"order\",\"user_id\":\"8\"}', '2026-08-28 17:04:31', NULL, '2026-08-28 15:04:23', '2026-08-28 15:04:31'),
(38, 'PAY-20260828152118-5285E8', 7, 26, NULL, 'order', 'stripe', 3010.00, 'pending', 'pi_3U9RakRuOcC0F31Z0fwvG5F4', NULL, NULL, NULL, NULL, '{\"order_id\":\"26\",\"purpose\":\"order\",\"user_id\":\"7\"}', NULL, NULL, '2026-08-28 15:21:18', '2026-08-28 15:21:18'),
(39, 'PAY-20260828152219-ACBEF9', 7, NULL, 11, 'gift_card_purchase', 'stripe', 1000.00, 'succeeded', 'pi_3U9RbjRuOcC0F31Z1wqdhYHp', NULL, NULL, NULL, NULL, '{\"gift_card_id\":\"11\",\"purpose\":\"gift_card_purchase\",\"user_id\":\"7\"}', '2026-08-28 17:22:44', NULL, '2026-08-28 15:22:19', '2026-08-28 15:22:44'),
(40, 'PAY-20260828152317-C3957E', 7, 27, 11, 'order', 'gift_card', 1000.00, 'succeeded', NULL, NULL, NULL, NULL, NULL, '{\"source\":\"checkout\",\"gift_card_serial\":\"GC-20260828152219-3DF1CF\",\"reserved_until_stripe_confirmation\":true}', '2026-08-28 17:23:31', NULL, '2026-08-28 15:23:17', '2026-08-28 15:23:31'),
(41, 'PAY-20260828152317-401FAB', 7, 27, NULL, 'order', 'stripe', 2010.00, 'succeeded', 'pi_3U9RcfRuOcC0F31Z1yNUWHfl', NULL, NULL, NULL, NULL, '{\"order_id\":\"27\",\"purpose\":\"order\",\"user_id\":\"7\"}', '2026-08-28 17:23:31', NULL, '2026-08-28 15:23:17', '2026-08-28 15:23:31');

-- --------------------------------------------------------

--
-- Structure de la table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(100) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `name_fr` varchar(255) NOT NULL,
  `name_en` varchar(255) NOT NULL,
  `name_pt` varchar(255) NOT NULL,
  `description_fr` longtext DEFAULT NULL,
  `description_en` longtext DEFAULT NULL,
  `description_pt` longtext DEFAULT NULL,
  `condition_type` enum('new','second_hand') NOT NULL DEFAULT 'new',
  `sale_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `rental_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `sale_price_eur` decimal(12,2) DEFAULT NULL,
  `rental_price_per_day_eur` decimal(12,2) DEFAULT NULL,
  `rental_deposit_eur` decimal(12,2) NOT NULL DEFAULT 0.00,
  `minimum_rental_days` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `maximum_rental_days` int(10) UNSIGNED DEFAULT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `products`
--

INSERT INTO `products` (`id`, `category_id`, `sku`, `slug`, `name_fr`, `name_en`, `name_pt`, `description_fr`, `description_en`, `description_pt`, `condition_type`, `sale_enabled`, `rental_enabled`, `sale_price_eur`, `rental_price_per_day_eur`, `rental_deposit_eur`, `minimum_rental_days`, `maximum_rental_days`, `featured`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 3, 'AKF-DRESS-001', 'robe-elegance-noire', 'Robe Élégance Noire', 'Black Elegance Dress', 'Vestido Elegância Preto', 'Robe élégante noire idéale pour les cérémonies, soirées et événements.', 'Elegant black dress perfect for ceremonies, evenings and events.', 'Vestido preto elegante ideal para cerimónias, festas e eventos.', 'new', 1, 1, 149.90, 25.00, 100.00, 1, 14, 1, 'archived', 1, '2026-08-10 14:48:22', '2026-08-15 01:47:45'),
(2, 3, 'AKF-DRESS-002', 'robe-royale-rouge', 'Robe Royale Rouge', 'Royal Red Dress', 'Vestido Real Vermelho', 'Robe longue rouge pour mariages, galas et cérémonies.', 'Long red dress for weddings, galas and ceremonies.', 'Vestido vermelho comprido para casamentos, galas e cerimónias.', 'new', 1, 1, 199.90, 35.00, 150.00, 2, 10, 1, 'active', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 4, 'AKF-SUIT-001', 'costume-premium-noir', 'Costume Premium Noir', 'Premium Black Suit', 'Fato Premium Preto', 'Costume noir premium avec coupe moderne.', 'Premium black suit with a modern fit.', 'Fato preto premium com corte moderno.', 'new', 1, 1, 299.90, 45.00, 200.00, 1, 14, 1, 'active', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(4, 5, 'AKF-BAG-001', 'sac-luxury-beige', 'Sac Luxury Beige', 'Luxury Beige Bag', 'Bolsa Luxury Bege', 'Sac à main élégant avec finition premium.', 'Elegant handbag with premium finishing.', 'Bolsa elegante com acabamento premium.', 'new', 1, 0, 89.90, NULL, 0.00, 1, NULL, 1, 'active', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(5, 2, 'AKF-SHIRT-001', 'chemise-classic-white', 'Chemise Classic Blanche', 'Classic White Shirt', 'Camisa Clássica Branca', 'Chemise blanche classique et élégante.', 'Classic and elegant white shirt.', 'Camisa branca clássica e elegante.', 'new', 1, 0, 59.90, NULL, 0.00, 1, NULL, 0, 'active', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(6, 3, 'AKF-DRESS-003', 'robe-vintage-seconde-main', 'Robe Vintage Seconde Main', 'Second-Hand Vintage Dress', 'Vestido Vintage Segunda Mão', 'Robe vintage en excellent état.', 'Vintage dress in excellent condition.', 'Vestido vintage em excelente estado.', 'second_hand', 1, 1, 79.90, 15.00, 50.00, 1, 7, 0, 'active', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(7, 2, 'profculotte', 'profculotte', 'Culotte professionnelle', 'Professional short', 'shoooooooooort', 'gfd dg dg dqfg sh srhsrh sidfjg sdkfjg s\nfg sodfkgh ^dfgh g qhg udfg sudfg \nsdfgjh iufh iudf hidfh guihqsdfiguh idufhg udhfg sd\nfgfdh uidfh ihdfgi udfi', 'gfd dg dg dqfg sh srhsrh sidfjg sdkfjg s\nfg sodfkgh ^dfgh g qhg udfg sudfg \nsdfgjh iufh iudf hidfh guihqsdfiguh idufhg udhfg sd\nfgfdh uidfh ihdfgi udfi', 'gfd dg dg dqfg sh srhsrh sidfjg sdkfjg s\nfg sodfkgh ^dfgh g qhg udfg sudfg \nsdfgjh iufh iudf hidfh guihqsdfiguh idufhg udhfg sd\nfgfdh uidfh ihdfgi udfi', 'new', 1, 1, 120.00, 12.00, 20.00, 1, NULL, 1, 'active', 8, '2026-08-21 08:42:20', '2026-08-21 08:42:20'),
(8, 2, 'PK-4582', 'sddfgdfgd', 'TTTTTTTT', 'TTTTTTT', 'TTTTTT', ',hger sf k<sf uysgf sgfk sdlf gsdlf lu<sgdf <sdfjkvf <sdfcg l<sgf uldfyk s', 'jsdhf <sdf <sdf gsdjlgf jl<df llgsdlfl <sfl gsdfj g<df', ';sdfh bkjdsb kjsdmk ghmkgh mhg miquhfim uhsdmi hih gm', 'second_hand', 1, 1, 1500.00, 12.00, 12.00, 1, 5, 1, 'active', 8, '2026-08-28 14:54:22', '2026-08-28 15:03:57');

-- --------------------------------------------------------

--
-- Structure de la table `product_images`
--

CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `alt_text`, `is_primary`, `sort_order`, `created_at`) VALUES
(3, 2, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Robe Royale Rouge', 1, 1, '2026-08-10 14:48:22'),
(4, 3, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Costume Premium Noir', 1, 1, '2026-08-10 14:48:22'),
(5, 4, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Sac Luxury Beige', 1, 1, '2026-08-10 14:48:22'),
(6, 5, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Chemise Classic Blanche', 1, 1, '2026-08-10 14:48:22'),
(7, 6, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Robe Vintage Seconde Main', 1, 1, '2026-08-10 14:48:22'),
(8, 1, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Robe Élégance Noire', 1, 0, '2026-08-15 01:56:24'),
(9, 1, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Robe Élégance Noire', 1, 2, '2026-08-15 01:57:55'),
(10, 2, 'https://ginatricot-pim.imgix.net/297282001/29728200101.jpg?fit=max&auto=format%2Ccompress&q=75&w=768', 'Robe Royale Rouge', 1, 0, '2026-08-15 01:59:13'),
(11, 7, 'http://localhost:3000/uploads/products/1787301740229-WhatsAppImage2026-05-27at18.55.401.jpeg', 'Culotte professionnelle', 0, 0, '2026-08-21 08:42:20'),
(12, 7, 'http://localhost:3000/uploads/products/1787301793813-home.jpeg', 'Culotte professionnelle', 0, 1, '2026-08-21 08:43:13'),
(13, 7, 'http://localhost:3000/uploads/products/1787301806426-ESLsbPoXsAAsLvX.jpg', 'Culotte professionnelle', 0, 0, '2026-08-21 08:43:26'),
(14, 7, 'http://localhost:3000/uploads/products/1787830286931-ESLsbPoXsAAsLvX.jpg', 'Culotte professionnelle', 0, 0, '2026-08-27 11:31:26'),
(15, 7, 'http://localhost:3000/uploads/products/1787830299526-WhatsAppImage2026-08-09at06.27.52-Photoroom.png', 'Culotte professionnelle', 0, 0, '2026-08-27 11:31:39'),
(16, 7, 'http://localhost:3000/uploads/products/1787830311301-ChatGPTImage22aot202622_43_31.png', 'Culotte professionnelle', 1, 0, '2026-08-27 11:31:51'),
(17, 8, 'http://localhost:3000/uploads/products/1787928862341-ESLsbPoXsAAsLvX.jpg', 'TTTTTTTT', 1, 0, '2026-08-28 14:54:22');

-- --------------------------------------------------------

--
-- Structure de la table `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `order_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `verified_purchase` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('pending','published','rejected','hidden') NOT NULL DEFAULT 'pending',
  `admin_reply` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `product_reviews`
--

INSERT INTO `product_reviews` (`id`, `product_id`, `user_id`, `order_item_id`, `rating`, `title`, `comment`, `verified_purchase`, `status`, `admin_reply`, `created_at`, `updated_at`) VALUES
(1, 1, 4, 1, 5, 'Magnifique robe', 'La robe est encore plus belle en vrai. Très bonne qualité et taille parfaite.', 1, 'published', 'Merci beaucoup pour votre confiance !', '2026-08-10 14:48:22', '2026-08-21 10:30:39'),
(2, 1, 6, NULL, 4, 'Très élégante', 'Belle finition et tissu agréable. Je recommande.', 0, 'published', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 1, 5, NULL, 5, 'Excellent', 'Produit conforme aux photos et livraison très correcte.', 0, 'published', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(4, 3, 5, NULL, 5, 'Costume impeccable', 'Très bonne coupe et excellente qualité.', 1, 'published', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(5, 4, 6, NULL, 4, 'Très joli sac', 'La couleur est belle et le sac semble solide.', 0, 'published', NULL, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(6, 7, 7, NULL, 3, 'Trop shic', 'J\'aime bien le modèle et la matière aussi est professionnel 👌🏽', 0, 'published', NULL, '2026-08-21 10:27:10', '2026-08-21 10:27:49');

-- --------------------------------------------------------

--
-- Structure de la table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `sku` varchar(100) NOT NULL,
  `size` varchar(50) DEFAULT NULL,
  `color_name` varchar(100) DEFAULT NULL,
  `color_hex` varchar(20) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `sale_price_eur` decimal(12,2) DEFAULT NULL,
  `rental_price_per_day_eur` decimal(12,2) DEFAULT NULL,
  `rental_deposit_eur` decimal(12,2) DEFAULT NULL,
  `stock_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `reserved_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `size`, `color_name`, `color_hex`, `barcode`, `sale_price_eur`, `rental_price_per_day_eur`, `rental_deposit_eur`, `stock_quantity`, `reserved_quantity`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'AKF-DRESS-001-S', 'S', 'Noir', '#000000', NULL, 149.90, 25.00, 100.00, 8, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(2, 1, 'AKF-DRESS-001-M', 'M', 'Noir', '#000000', NULL, 149.90, 25.00, 100.00, 12, 1, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 1, 'AKF-DRESS-001-L', 'L', 'Noir', '#000000', NULL, 149.90, 25.00, 100.00, 7, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(4, 2, 'AKF-DRESS-002-M', 'M', 'Rouge', '#C1121F', NULL, 199.90, 35.00, 150.00, 6, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(5, 2, 'AKF-DRESS-002-L', 'L', 'Rouge', '#C1121F', NULL, 199.90, 35.00, 150.00, 5, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(6, 3, 'AKF-SUIT-001-M', 'M', 'Noir', '#000000', NULL, 299.90, 45.00, 200.00, 5, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(7, 3, 'AKF-SUIT-001-L', 'L', 'Noir', '#000000', NULL, 299.90, 45.00, 200.00, 5, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(8, 4, 'AKF-BAG-001-STD', NULL, 'Beige', '#D8C3A5', NULL, 89.90, NULL, NULL, 20, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(9, 5, 'AKF-SHIRT-001-M', 'M', 'Blanc', '#FFFFFF', NULL, 59.90, NULL, NULL, 15, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(10, 5, 'AKF-SHIRT-001-L', 'L', 'Blanc', '#FFFFFF', NULL, 59.90, NULL, NULL, 10, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(11, 6, 'AKF-DRESS-003-M', 'M', 'Bleu', '#345995', NULL, 79.90, 15.00, 50.00, 2, 0, 'active', '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(12, 8, 'PK-4582-STD', 'Unique', NULL, '#071846', NULL, 1500.00, 12.00, 12.00, 1, 0, 'active', '2026-08-28 15:03:57', '2026-08-28 15:03:57'),
(13, 7, 'profculotte-STD', 'Unique', NULL, '#071846', NULL, 120.00, 12.00, 20.00, 1, 0, 'active', '2026-08-28 15:04:02', '2026-08-28 15:04:02');

-- --------------------------------------------------------

--
-- Structure de la table `second_hand_proposals`
--

CREATE TABLE `second_hand_proposals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `proposal_number` varchar(100) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `item_type` varchar(120) NOT NULL,
  `brand` varchar(150) NOT NULL,
  `size` varchar(80) DEFAULT NULL,
  `color` varchar(100) DEFAULT NULL,
  `condition_state` enum('new_never_worn','excellent','very_good','good','fair') NOT NULL,
  `description` text DEFAULT NULL,
  `desired_price_eur` decimal(12,2) NOT NULL,
  `offered_price_eur` decimal(12,2) DEFAULT NULL,
  `final_price_eur` decimal(12,2) DEFAULT NULL,
  `status` enum('submitted','under_review','offer_sent','accepted','rejected','awaiting_item','item_received','verified','verification_failed','payment_pending','paid','completed','cancelled') NOT NULL DEFAULT 'submitted',
  `bank_account_holder` varchar(190) NOT NULL,
  `bank_account_number` text NOT NULL,
  `bank_name` varchar(190) NOT NULL,
  `evaluated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `evaluated_at` datetime DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `handover_method` enum('dropoff','shipping') DEFAULT NULL,
  `handover_instructions` text DEFAULT NULL,
  `user_responded_at` datetime DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `item_received_at` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `payment_reference` varchar(190) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `second_hand_proposals`
--

INSERT INTO `second_hand_proposals` (`id`, `proposal_number`, `user_id`, `category_id`, `item_type`, `brand`, `size`, `color`, `condition_state`, `description`, `desired_price_eur`, `offered_price_eur`, `final_price_eur`, `status`, `bank_account_holder`, `bank_account_number`, `bank_name`, `evaluated_by`, `evaluated_at`, `admin_notes`, `handover_method`, `handover_instructions`, `user_responded_at`, `accepted_at`, `rejected_at`, `item_received_at`, `verified_at`, `paid_at`, `payment_reference`, `created_at`, `updated_at`) VALUES
(1, 'SHP-1788143468881-53359C', 7, NULL, 'Pangalon', 'Zara', 'M', 'Rouge', 'good', 'C\'est top ce pantalon', 26.00, 10.00, 10.00, 'completed', 'Akam Baran', 'D758b7VGRj3Z1fGY:ou/wlv92xBu22+GLl52mKg==:Lk2zgzO8NLY0nw==', 'Belgas', 8, '2026-08-31 05:07:06', 'Nous voyons que l\'habit a l\'aire abimé', 'dropoff', 'Venez avec à l\'avenue', '2026-08-31 05:08:31', '2026-08-31 05:08:31', NULL, '2026-08-31 05:11:11', NULL, '2026-08-31 05:10:36', '896547123', '2026-08-31 02:31:08', '2026-08-31 03:11:26');

-- --------------------------------------------------------

--
-- Structure de la table `second_hand_proposal_images`
--

CREATE TABLE `second_hand_proposal_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `proposal_id` bigint(20) UNSIGNED NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `second_hand_proposal_images`
--

INSERT INTO `second_hand_proposal_images` (`id`, `proposal_id`, `image_url`, `sort_order`, `created_at`) VALUES
(1, 1, 'http://192.168.129.0:3000/uploads/second-hand-proposals/1788143468992-c2f8adc6-d1fb-4b0f-a791-baccb8192791-1_all_97502.jpg', 0, '2026-08-31 02:31:09'),
(2, 1, 'http://192.168.129.0:3000/uploads/second-hand-proposals/1788143468998-c2f8adc6-d1fb-4b0f-a791-baccb8192791-1_all_97501.jpg', 1, '2026-08-31 02:31:09'),
(3, 1, 'http://192.168.129.0:3000/uploads/second-hand-proposals/1788143469016-c2f8adc6-d1fb-4b0f-a791-baccb8192791-1_all_97503.jpg', 2, '2026-08-31 02:31:09');

-- --------------------------------------------------------

--
-- Structure de la table `settings`
--

CREATE TABLE `settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `updated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'company_name', 'AK Fashion Plus', 'Platform/company name', NULL, '2026-08-10 12:16:58', '2026-08-10 12:16:58'),
(2, 'default_currency', 'EUR', 'Main commercial currency', NULL, '2026-08-10 12:16:58', '2026-08-10 12:16:58'),
(3, 'display_currency', 'Kwanza', 'Secondary currency displayed under EUR prices', 8, '2026-08-10 12:16:58', '2026-08-15 13:27:15'),
(4, 'default_language', 'pt', 'Default application language', NULL, '2026-08-10 12:16:58', '2026-08-10 12:16:58'),
(5, 'rental_late_fee_per_day_eur', '0', 'Default late return fee per day', NULL, '2026-08-10 12:16:58', '2026-08-10 12:16:58'),
(6, 'gift_card_expiration_enabled', 'false', 'Whether gift cards can expire', 8, '2026-08-10 12:16:58', '2026-08-15 04:32:00');

-- --------------------------------------------------------

--
-- Structure de la table `stripe_webhook_events`
--

CREATE TABLE `stripe_webhook_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `stripe_event_id` varchar(255) NOT NULL,
  `event_type` varchar(150) NOT NULL,
  `status` enum('received','processed','failed','ignored') NOT NULL DEFAULT 'received',
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `error_message` text DEFAULT NULL,
  `received_at` datetime NOT NULL DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('user','cashier','admin') NOT NULL DEFAULT 'user',
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `preferred_language` enum('fr','en','pt') NOT NULL DEFAULT 'pt',
  `country_code` char(2) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `referral_code` varchar(40) DEFAULT NULL,
  `referred_by_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('active','inactive','blocked','pending') NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `role`, `branch_id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `preferred_language`, `country_code`, `avatar_url`, `referral_code`, `referred_by_user_id`, `status`, `email_verified_at`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'admin', NULL, 'Amram', 'Bassime', 'admin@akfashionplus.com', '+32470000001', '$2a$12$a0ljAogR0biX4oXLNiorKOuVqBAelumOIilx1Z3cfShtvuCVxOMYS', 'fr', 'BE', NULL, 'AK110C87E0A', NULL, 'active', '2026-08-10 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-29 16:17:00'),
(2, 'cashier', 1, 'Manuel', 'Domingos', 'manuel@akfashionplus.com', '+244923100001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'pt', 'AO', NULL, 'AK24C7CB55D', NULL, 'active', '2026-08-10 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-29 16:17:00'),
(3, 'cashier', 2, 'Sofia', 'Mateus', 'sofia@akfashionplus.com', '+244923100002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'pt', 'AO', NULL, 'AK337EA1A0D', NULL, 'active', '2026-08-10 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-29 16:17:00'),
(4, 'user', NULL, 'Marie', 'Kiala', 'marie@example.com', '+32470000101', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'fr', 'BE', NULL, 'AK4ADF5EF65', NULL, 'active', '2026-08-10 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-29 16:17:00'),
(5, 'user', NULL, 'Carlos', 'Miguel', 'carlos@example.com', '+244923200001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'pt', 'AO', NULL, 'AK50FD8A4F1', NULL, 'active', '2026-08-10 16:48:22', NULL, '2026-08-10 14:48:22', '2026-08-29 16:17:00'),
(6, 'user', NULL, 'Sarah', 'Williams', 'sarah@example.com', '+32470000103', 'pbkdf2$120000$cd8ed9e5e261c6f14bcab04efd9391f8$10e5e67df311aa7da91741b40f9dd7b84674dd876cef854f490daa03d18e1482c0a28770e18354b905b02ba8d85a6c6b13a9838e46ca66b171805b9529cf4b36', 'en', 'BE', NULL, 'AK69410CE8B', NULL, 'active', '2026-08-10 16:48:22', '2026-08-15 15:17:00', '2026-08-10 14:48:22', '2026-08-29 16:17:00'),
(7, 'cashier', NULL, 'Josiane Nsama', 'Ename', 'josianne@ak.com', '+3248598745', 'pbkdf2$120000$cd8ed9e5e261c6f14bcab04efd9391f8$10e5e67df311aa7da91741b40f9dd7b84674dd876cef854f490daa03d18e1482c0a28770e18354b905b02ba8d85a6c6b13a9838e46ca66b171805b9529cf4b36', 'fr', 'AO', 'http://192.168.129.0:3000/uploads/avatars/1787091407867-5ce4fd06-dfe5-44f5-a562-4f7dc1fa35ab.png', 'AK7F43E11F2', NULL, 'active', NULL, '2026-08-31 05:19:12', '2026-08-12 21:50:17', '2026-08-31 23:46:46'),
(8, 'admin', NULL, 'AMRAM', 'GOULMEMEI BASSIME', 'admin@gmail.com', '+32470927870', 'pbkdf2$120000$0d105cee50ff5283273deca7ef769fcb$3bd9d343178b7072a851b4156a9737238d01952e8e00b337e55f3ac57f12831278e7b5bfad5b24d2d122927c145835ad99e0f55d5f38e3270aa2fa2ca304541b', 'fr', NULL, NULL, 'AK8D753BFF3', NULL, 'active', NULL, '2026-09-04 15:07:15', '2026-08-14 21:15:24', '2026-09-04 13:07:15');

-- --------------------------------------------------------

--
-- Structure de la table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  `recipient_name` varchar(200) NOT NULL,
  `recipient_phone` varchar(50) DEFAULT NULL,
  `address_line_1` varchar(255) NOT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `city` varchar(150) NOT NULL,
  `province` varchar(150) DEFAULT NULL,
  `postal_code` varchar(30) DEFAULT NULL,
  `country_code` char(2) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user_addresses`
--

INSERT INTO `user_addresses` (`id`, `user_id`, `label`, `recipient_name`, `recipient_phone`, `address_line_1`, `address_line_2`, `city`, `province`, `postal_code`, `country_code`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 4, 'Maison', 'Marie Kiala', '+32470000101', 'Rue de la Loi 100', NULL, 'Bruxelles', NULL, '1000', 'BE', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(2, 5, 'Casa', 'Carlos Miguel', '+244923200001', 'Rua Amilcar Cabral 50', NULL, 'Luanda', NULL, NULL, 'AO', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22'),
(3, 6, 'Home', 'Sarah Williams', '+32470000103', 'Avenue Louise 200', NULL, 'Bruxelles', NULL, '1050', 'BE', 1, '2026-08-10 14:48:22', '2026-08-10 14:48:22');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_active_rentals`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_active_rentals` (
`order_item_id` bigint(20) unsigned
,`order_id` bigint(20) unsigned
,`order_number` varchar(50)
,`user_id` bigint(20) unsigned
,`product_id` bigint(20) unsigned
,`product_variant_id` bigint(20) unsigned
,`product_name` varchar(255)
,`rental_start_date` date
,`rental_end_date` date
,`rental_days` int(10) unsigned
,`rental_status` enum('not_applicable','reserved','ready_for_pickup','active','return_due','overdue','returned','damaged','lost','cancelled')
,`rental_price_per_day_eur` decimal(12,2)
,`line_total_eur` decimal(12,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_company_resale_liability`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_company_resale_liability` (
`branch_id` bigint(20) unsigned
,`branch_name` varchar(150)
,`total_operations` bigint(21)
,`total_eur` decimal(34,2)
,`total_aoa` decimal(40,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_current_exchange_rate`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_current_exchange_rate` (
`id` bigint(20) unsigned
,`base_currency` char(3)
,`quote_currency` char(3)
,`rate` decimal(18,6)
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_daily_sales`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_daily_sales` (
`sale_date` date
,`total_orders` bigint(21)
,`revenue_eur` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_gift_card_liability`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_gift_card_liability` (
`active_cards` bigint(21)
,`total_balance_eur` decimal(34,2)
,`total_reserved_eur` decimal(34,2)
,`total_available_eur` decimal(35,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_monthly_sales`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_monthly_sales` (
`sale_year` int(4)
,`sale_month` int(2)
,`total_orders` bigint(21)
,`revenue_eur` decimal(34,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_product_ratings`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_product_ratings` (
`product_id` bigint(20) unsigned
,`total_reviews` bigint(21)
,`average_rating` decimal(6,2)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_user_gift_cards`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_user_gift_cards` (
`id` bigint(20) unsigned
,`owner_user_id` bigint(20) unsigned
,`serial_number` varchar(100)
,`card_name` varchar(150)
,`card_code` varchar(50)
,`initial_balance_eur` decimal(12,2)
,`current_balance_eur` decimal(12,2)
,`reserved_balance_eur` decimal(12,2)
,`available_balance_eur` decimal(13,2)
,`status` enum('pending_payment','unassigned','active','blocked','fully_used','expired','cancelled')
,`expires_at` datetime
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_user_gift_card_totals`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_user_gift_card_totals` (
`owner_user_id` bigint(20) unsigned
,`total_cards` bigint(21)
,`current_balance_eur` decimal(34,2)
,`reserved_balance_eur` decimal(34,2)
,`available_balance_eur` decimal(35,2)
);

-- --------------------------------------------------------

--
-- Structure de la vue `v_active_rentals`
--
DROP TABLE IF EXISTS `v_active_rentals`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_active_rentals`  AS SELECT `oi`.`id` AS `order_item_id`, `oi`.`order_id` AS `order_id`, `o`.`order_number` AS `order_number`, `o`.`user_id` AS `user_id`, `oi`.`product_id` AS `product_id`, `oi`.`product_variant_id` AS `product_variant_id`, `oi`.`product_name` AS `product_name`, `oi`.`rental_start_date` AS `rental_start_date`, `oi`.`rental_end_date` AS `rental_end_date`, `oi`.`rental_days` AS `rental_days`, `oi`.`rental_status` AS `rental_status`, `oi`.`rental_price_per_day_eur` AS `rental_price_per_day_eur`, `oi`.`line_total_eur` AS `line_total_eur` FROM (`order_items` `oi` join `orders` `o` on(`o`.`id` = `oi`.`order_id`)) WHERE `oi`.`item_type` = 'rental' AND `oi`.`rental_status` in ('reserved','ready_for_pickup','active','return_due','overdue') ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_company_resale_liability`
--
DROP TABLE IF EXISTS `v_company_resale_liability`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_company_resale_liability`  AS SELECT `cr`.`branch_id` AS `branch_id`, `b`.`name` AS `branch_name`, count(0) AS `total_operations`, coalesce(sum(`cr`.`amount_eur`),0) AS `total_eur`, coalesce(sum(`cr`.`payout_amount_aoa`),0) AS `total_aoa` FROM (`company_resales` `cr` join `branches` `b` on(`b`.`id` = `cr`.`branch_id`)) WHERE `cr`.`status` in ('approved','ready_for_payout') GROUP BY `cr`.`branch_id`, `b`.`name` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_current_exchange_rate`
--
DROP TABLE IF EXISTS `v_current_exchange_rate`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_current_exchange_rate`  AS SELECT `exchange_rates`.`id` AS `id`, `exchange_rates`.`base_currency` AS `base_currency`, `exchange_rates`.`quote_currency` AS `quote_currency`, `exchange_rates`.`rate` AS `rate`, `exchange_rates`.`created_at` AS `created_at` FROM `exchange_rates` WHERE `exchange_rates`.`base_currency` = 'EUR' AND `exchange_rates`.`quote_currency` = 'AOA' AND `exchange_rates`.`is_current` = 1 ORDER BY `exchange_rates`.`id` DESC LIMIT 0, 1 ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_daily_sales`
--
DROP TABLE IF EXISTS `v_daily_sales`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_daily_sales`  AS SELECT cast(`orders`.`created_at` as date) AS `sale_date`, count(0) AS `total_orders`, coalesce(sum(case when `orders`.`payment_status` = 'paid' then `orders`.`total_eur` else 0 end),0) AS `revenue_eur` FROM `orders` GROUP BY cast(`orders`.`created_at` as date) ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_gift_card_liability`
--
DROP TABLE IF EXISTS `v_gift_card_liability`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_gift_card_liability`  AS SELECT count(0) AS `active_cards`, coalesce(sum(`gift_cards`.`current_balance_eur`),0) AS `total_balance_eur`, coalesce(sum(`gift_cards`.`reserved_balance_eur`),0) AS `total_reserved_eur`, coalesce(sum(`gift_cards`.`current_balance_eur` - `gift_cards`.`reserved_balance_eur`),0) AS `total_available_eur` FROM `gift_cards` WHERE `gift_cards`.`status` = 'active' ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_monthly_sales`
--
DROP TABLE IF EXISTS `v_monthly_sales`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_monthly_sales`  AS SELECT year(`orders`.`created_at`) AS `sale_year`, month(`orders`.`created_at`) AS `sale_month`, count(0) AS `total_orders`, coalesce(sum(case when `orders`.`payment_status` = 'paid' then `orders`.`total_eur` else 0 end),0) AS `revenue_eur` FROM `orders` GROUP BY year(`orders`.`created_at`), month(`orders`.`created_at`) ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_product_ratings`
--
DROP TABLE IF EXISTS `v_product_ratings`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_product_ratings`  AS SELECT `product_reviews`.`product_id` AS `product_id`, count(0) AS `total_reviews`, round(avg(`product_reviews`.`rating`),2) AS `average_rating` FROM `product_reviews` WHERE `product_reviews`.`status` = 'published' GROUP BY `product_reviews`.`product_id` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_user_gift_cards`
--
DROP TABLE IF EXISTS `v_user_gift_cards`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_user_gift_cards`  AS SELECT `gc`.`id` AS `id`, `gc`.`owner_user_id` AS `owner_user_id`, `gc`.`serial_number` AS `serial_number`, `gct`.`name` AS `card_name`, `gct`.`code` AS `card_code`, `gc`.`initial_balance_eur` AS `initial_balance_eur`, `gc`.`current_balance_eur` AS `current_balance_eur`, `gc`.`reserved_balance_eur` AS `reserved_balance_eur`, `gc`.`current_balance_eur`- `gc`.`reserved_balance_eur` AS `available_balance_eur`, `gc`.`status` AS `status`, `gc`.`expires_at` AS `expires_at`, `gc`.`created_at` AS `created_at` FROM (`gift_cards` `gc` join `gift_card_types` `gct` on(`gct`.`id` = `gc`.`gift_card_type_id`)) ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_user_gift_card_totals`
--
DROP TABLE IF EXISTS `v_user_gift_card_totals`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_user_gift_card_totals`  AS SELECT `gift_cards`.`owner_user_id` AS `owner_user_id`, count(0) AS `total_cards`, sum(`gift_cards`.`current_balance_eur`) AS `current_balance_eur`, sum(`gift_cards`.`reserved_balance_eur`) AS `reserved_balance_eur`, sum(`gift_cards`.`current_balance_eur` - `gift_cards`.`reserved_balance_eur`) AS `available_balance_eur` FROM `gift_cards` WHERE `gift_cards`.`owner_user_id` is not null AND `gift_cards`.`status` = 'active' GROUP BY `gift_cards`.`owner_user_id` ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_user` (`user_id`),
  ADD KEY `idx_audit_logs_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_logs_action` (`action`),
  ADD KEY `idx_audit_logs_created` (`created_at`);

--
-- Index pour la table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_branches_status` (`status`),
  ADD KEY `idx_branches_city` (`city`);

--
-- Index pour la table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carts_user` (`user_id`,`status`);

--
-- Index pour la table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cart_items_cart` (`cart_id`),
  ADD KEY `idx_cart_items_variant` (`product_variant_id`);

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_categories_parent` (`parent_id`),
  ADD KEY `idx_categories_status` (`status`);

--
-- Index pour la table `company_resales`
--
ALTER TABLE `company_resales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_item_id` (`order_item_id`),
  ADD KEY `fk_company_resales_approved_by` (`approved_by`),
  ADD KEY `idx_company_resales_user` (`user_id`),
  ADD KEY `idx_company_resales_branch` (`branch_id`),
  ADD KEY `idx_company_resales_status` (`status`),
  ADD KEY `idx_company_resales_cashier` (`cashier_id`),
  ADD KEY `idx_company_resales_created` (`created_at`);

--
-- Index pour la table `delivery_countries`
--
ALTER TABLE `delivery_countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `country_code` (`country_code`),
  ADD KEY `idx_delivery_countries_status` (`status`),
  ADD KEY `idx_delivery_countries_sort` (`sort_order`);

--
-- Index pour la table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_exchange_rates_user` (`created_by`),
  ADD KEY `idx_exchange_rates_current` (`base_currency`,`quote_currency`,`is_current`),
  ADD KEY `idx_exchange_rates_created` (`created_at`);

--
-- Index pour la table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_favorites_user_product` (`user_id`,`product_id`),
  ADD KEY `fk_favorites_product` (`product_id`),
  ADD KEY `idx_favorites_user` (`user_id`);

--
-- Index pour la table `gift_cards`
--
ALTER TABLE `gift_cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `serial_number` (`serial_number`),
  ADD KEY `fk_gift_cards_type` (`gift_card_type_id`),
  ADD KEY `fk_gift_cards_created_by` (`created_by`),
  ADD KEY `idx_gift_cards_owner` (`owner_user_id`),
  ADD KEY `idx_gift_cards_purchased_by` (`purchased_by`),
  ADD KEY `idx_gift_cards_status` (`status`),
  ADD KEY `idx_gift_cards_owner_status` (`owner_user_id`,`status`);

--
-- Index pour la table `gift_card_transactions`
--
ALTER TABLE `gift_card_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_reference` (`transaction_reference`),
  ADD KEY `fk_gift_card_transactions_user` (`created_by`),
  ADD KEY `idx_gift_card_transactions_card` (`gift_card_id`),
  ADD KEY `idx_gift_card_transactions_payment` (`payment_id`),
  ADD KEY `idx_gift_card_transactions_order` (`order_id`),
  ADD KEY `idx_gift_card_transactions_created` (`created_at`);

--
-- Index pour la table `gift_card_types`
--
ALTER TABLE `gift_card_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_gift_card_types_user` (`created_by`),
  ADD KEY `idx_gift_card_types_status` (`status`);

--
-- Index pour la table `important_links`
--
ALTER TABLE `important_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_important_links_status_sort` (`status`,`sort_order`),
  ADD KEY `idx_important_links_slug` (`slug`),
  ADD KEY `fk_important_links_created_by` (`created_by`),
  ADD KEY `fk_important_links_updated_by` (`updated_by`);

--
-- Index pour la table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_inventory_user` (`created_by`),
  ADD KEY `idx_inventory_variant` (`product_variant_id`),
  ADD KEY `idx_inventory_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_inventory_created` (`created_at`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_unread` (`user_id`,`is_read`),
  ADD KEY `idx_notifications_created` (`created_at`);

--
-- Index pour la table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_branch` (`branch_id`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_payment_status` (`payment_status`),
  ADD KEY `idx_orders_created` (`created_at`);

--
-- Index pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`),
  ADD KEY `idx_order_items_variant` (`product_variant_id`),
  ADD KEY `idx_order_items_rental_dates` (`product_variant_id`,`rental_start_date`,`rental_end_date`),
  ADD KEY `idx_order_items_rental_status` (`rental_status`);

--
-- Index pour la table `order_pickups`
--
ALTER TABLE `order_pickups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_pickups_order` (`order_id`),
  ADD KEY `idx_order_pickups_branch` (`branch_id`),
  ADD KEY `idx_order_pickups_cashier` (`cashier_id`),
  ADD KEY `idx_order_pickups_completed` (`completed_at`);

--
-- Index pour la table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order_status_history_user` (`changed_by`),
  ADD KEY `idx_order_status_history_order` (`order_id`),
  ADD KEY `idx_order_status_history_created` (`created_at`);

--
-- Index pour la table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_reference` (`payment_reference`),
  ADD UNIQUE KEY `stripe_payment_intent_id` (`stripe_payment_intent_id`),
  ADD UNIQUE KEY `stripe_checkout_session_id` (`stripe_checkout_session_id`),
  ADD KEY `idx_payments_user` (`user_id`),
  ADD KEY `idx_payments_order` (`order_id`),
  ADD KEY `idx_payments_gift_card` (`gift_card_id`),
  ADD KEY `idx_payments_method` (`method`),
  ADD KEY `idx_payments_purpose` (`purpose`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `idx_payments_created` (`created_at`);

--
-- Index pour la table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_products_created_by` (`created_by`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_condition` (`condition_type`),
  ADD KEY `idx_products_status` (`status`),
  ADD KEY `idx_products_featured` (`featured`),
  ADD KEY `idx_products_sale` (`sale_enabled`),
  ADD KEY `idx_products_rental` (`rental_enabled`);

--
-- Index pour la table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product` (`product_id`);

--
-- Index pour la table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_product_reviews_order_item` (`user_id`,`order_item_id`),
  ADD KEY `fk_product_reviews_order_item` (`order_item_id`),
  ADD KEY `idx_product_reviews_product` (`product_id`,`status`),
  ADD KEY `idx_product_reviews_user` (`user_id`),
  ADD KEY `idx_product_reviews_rating` (`rating`);

--
-- Index pour la table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `idx_product_variants_product` (`product_id`),
  ADD KEY `idx_product_variants_status` (`status`),
  ADD KEY `idx_product_variants_size` (`size`),
  ADD KEY `idx_product_variants_color` (`color_name`);

--
-- Index pour la table `second_hand_proposals`
--
ALTER TABLE `second_hand_proposals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `proposal_number` (`proposal_number`),
  ADD KEY `fk_second_hand_proposals_evaluator` (`evaluated_by`),
  ADD KEY `idx_second_hand_proposals_user` (`user_id`),
  ADD KEY `idx_second_hand_proposals_status` (`status`),
  ADD KEY `idx_second_hand_proposals_created` (`created_at`),
  ADD KEY `idx_second_hand_proposals_number` (`proposal_number`),
  ADD KEY `idx_second_hand_proposals_category` (`category_id`);

--
-- Index pour la table `second_hand_proposal_images`
--
ALTER TABLE `second_hand_proposal_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_second_hand_proposal_images_proposal` (`proposal_id`);

--
-- Index pour la table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `fk_settings_updated_by` (`updated_by`);

--
-- Index pour la table `stripe_webhook_events`
--
ALTER TABLE `stripe_webhook_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `stripe_event_id` (`stripe_event_id`),
  ADD KEY `idx_stripe_webhooks_type` (`event_type`),
  ADD KEY `idx_stripe_webhooks_status` (`status`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `uq_users_referral_code` (`referral_code`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_branch` (`branch_id`),
  ADD KEY `idx_users_status` (`status`),
  ADD KEY `idx_users_phone` (`phone`),
  ADD KEY `idx_users_referred_by` (`referred_by_user_id`);

--
-- Index pour la table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_addresses_user` (`user_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `company_resales`
--
ALTER TABLE `company_resales`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT pour la table `delivery_countries`
--
ALTER TABLE `delivery_countries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `gift_cards`
--
ALTER TABLE `gift_cards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `gift_card_transactions`
--
ALTER TABLE `gift_card_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT pour la table `gift_card_types`
--
ALTER TABLE `gift_card_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `important_links`
--
ALTER TABLE `important_links`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT pour la table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT pour la table `order_pickups`
--
ALTER TABLE `order_pickups`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT pour la table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `second_hand_proposals`
--
ALTER TABLE `second_hand_proposals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `second_hand_proposal_images`
--
ALTER TABLE `second_hand_proposal_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `stripe_webhook_events`
--
ALTER TABLE `stripe_webhook_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Contraintes pour la table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `company_resales`
--
ALTER TABLE `company_resales`
  ADD CONSTRAINT `fk_company_resales_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_company_resales_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `fk_company_resales_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_company_resales_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`),
  ADD CONSTRAINT `fk_company_resales_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `exchange_rates`
--
ALTER TABLE `exchange_rates`
  ADD CONSTRAINT `fk_exchange_rates_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `gift_cards`
--
ALTER TABLE `gift_cards`
  ADD CONSTRAINT `fk_gift_cards_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_gift_cards_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_gift_cards_purchased_by` FOREIGN KEY (`purchased_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_gift_cards_type` FOREIGN KEY (`gift_card_type_id`) REFERENCES `gift_card_types` (`id`);

--
-- Contraintes pour la table `gift_card_transactions`
--
ALTER TABLE `gift_card_transactions`
  ADD CONSTRAINT `fk_gift_card_transactions_card` FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards` (`id`),
  ADD CONSTRAINT `fk_gift_card_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_gift_card_transactions_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_gift_card_transactions_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `gift_card_types`
--
ALTER TABLE `gift_card_types`
  ADD CONSTRAINT `fk_gift_card_types_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `important_links`
--
ALTER TABLE `important_links`
  ADD CONSTRAINT `fk_important_links_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_important_links_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `fk_inventory_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inventory_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`);

--
-- Contraintes pour la table `order_pickups`
--
ALTER TABLE `order_pickups`
  ADD CONSTRAINT `fk_order_pickups_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  ADD CONSTRAINT `fk_order_pickups_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_order_pickups_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Contraintes pour la table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `fk_order_status_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_status_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_gift_card` FOREIGN KEY (`gift_card_id`) REFERENCES `gift_cards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `fk_product_reviews_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_product_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_product_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `second_hand_proposals`
--
ALTER TABLE `second_hand_proposals`
  ADD CONSTRAINT `fk_second_hand_proposals_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_second_hand_proposals_evaluator` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_second_hand_proposals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `second_hand_proposal_images`
--
ALTER TABLE `second_hand_proposal_images`
  ADD CONSTRAINT `fk_second_hand_proposal_images_proposal` FOREIGN KEY (`proposal_id`) REFERENCES `second_hand_proposals` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `fk_settings_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_referred_by` FOREIGN KEY (`referred_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
