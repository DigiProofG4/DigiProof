-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: digiproof
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `digiproof`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `digiproof` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `digiproof`;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `retailer_id` int NOT NULL,
  `name` varchar(160) NOT NULL,
  `brand` varchar(120) DEFAULT NULL,
  `model` varchar(120) DEFAULT NULL,
  `serial_number` varchar(120) NOT NULL,
  `warranty_months` int NOT NULL DEFAULT '12',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `ix_products_retailer` (`retailer_id`),
  CONSTRAINT `fk_products_retailer` FOREIGN KEY (`retailer_id`) REFERENCES `retailers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,'Aurora 27\" Monitor','Aurora','A27-QHD','AUR-27-000451',24,'2026-09-20 09:08:23'),(6,1,'LG 420L Bottom Mount Fridge Freezer - Black Finish','LG','GB-455BLE','239059',12,'2026-09-21 20:29:57'),(7,1,'Samsung 32 Inch F6000F Full HD Smart TV','Samsaung','LS32F6000FSXNZ','247067',12,'2026-09-21 20:35:12');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `retailers`
--

DROP TABLE IF EXISTS `retailers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `retailers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `business_name` varchar(160) NOT NULL,
  `registration_number` varchar(80) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_retailers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retailers`
--

LOCK TABLES `retailers` WRITE;
/*!40000 ALTER TABLE `retailers` DISABLE KEYS */;
INSERT INTO `retailers` VALUES (1,1,'Sunrise Electronics','NZBN-9429041234567','2026-09-20 09:08:23');
/*!40000 ALTER TABLE `retailers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `warranty_id` int NOT NULL,
  `from_user_id` int DEFAULT NULL,
  `to_user_id` int NOT NULL,
  `tx_hash` varchar(80) DEFAULT NULL,
  `transferred_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_transfers_from` (`from_user_id`),
  KEY `fk_transfers_to` (`to_user_id`),
  KEY `ix_transfers_warranty` (`warranty_id`),
  CONSTRAINT `fk_transfers_from` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_transfers_to` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_transfers_warranty` FOREIGN KEY (`warranty_id`) REFERENCES `warranties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfers`
--

LOCK TABLES `transfers` WRITE;
/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
INSERT INTO `transfers` VALUES (1,1,NULL,2,'0x8f5b412c6a50902c7c41350c55c5c78d312da210d30ff2e935022f9b5fb82a6c','2026-09-20 09:08:23'),(6,6,NULL,2,'0x8d0813d712a22a2c4f275d6c125436e88d61a8562a8f6acb56f29f3337e244f3','2026-09-21 20:31:37'),(7,7,NULL,2,'0x0b3db1bf7f18f6e9c2ad5e127fac05c64ef8840b30e38aaf3fcf55a015d017f0','2026-09-21 20:35:51');
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `role` enum('retailer','customer') NOT NULL,
  `wallet_address` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@digiproof.com','$2b$12$AMKmsB3ftZstNh6Q6G5ZA.SsQAgWWsxgsOFKEQtfzzejPuSzVH8gC','Sunrise Electronics','retailer',NULL,'2026-09-20 09:08:23'),(2,'buyer@digiproof.com','$2b$12$AMKmsB3ftZstNh6Q6G5ZA.SsQAgWWsxgsOFKEQtfzzejPuSzVH8gC','Ava Chen','customer',NULL,'2026-09-20 09:08:23');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warranties`
--

DROP TABLE IF EXISTS `warranties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warranties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `owner_id` int NOT NULL,
  `issued_by_retailer_id` int NOT NULL,
  `purchase_date` date NOT NULL,
  `expires_on` date NOT NULL,
  `price_paid` decimal(12,2) DEFAULT NULL,
  `terms` text,
  `status` enum('pending','active','expired','void') NOT NULL DEFAULT 'pending',
  `token_id` varchar(80) DEFAULT NULL,
  `tx_hash` varchar(80) DEFAULT NULL,
  `metadata_uri` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `gas_used` bigint DEFAULT NULL,
  `gas_price_wei` bigint DEFAULT NULL,
  `block_number` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  KEY `ix_warranties_owner` (`owner_id`),
  KEY `ix_warranties_retailer` (`issued_by_retailer_id`),
  CONSTRAINT `fk_warranties_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_warranties_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_warranties_retailer` FOREIGN KEY (`issued_by_retailer_id`) REFERENCES `retailers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warranties`
--

LOCK TABLES `warranties` WRITE;
/*!40000 ALTER TABLE `warranties` DISABLE KEYS */;
INSERT INTO `warranties` VALUES (1,1,2,1,'2026-03-14','2028-03-14',649.00,'Parts and labour. Covers panel defects, excludes accidental damage.','active','2405122348','0x8f5b412c6a50902c7c41350c55c5c78d312da210d30ff2e935022f9b5fb82a6c','ipfs://placeholder/demo-seed','2026-09-20 09:08:23',NULL,NULL,NULL),(6,6,2,1,'2026-09-22','2027-09-22',1299.00,NULL,'active','5','0x8d0813d712a22a2c4f275d6c125436e88d61a8562a8f6acb56f29f3337e244f3','ipfs://bafyb3dff7b5202ab98923df1ac5fd21a5281a19f588c79fd9','2026-09-21 20:31:21',NULL,NULL,NULL),(7,7,2,1,'2026-09-22','2027-09-22',418.00,NULL,'active','6','0x0b3db1bf7f18f6e9c2ad5e127fac05c64ef8840b30e38aaf3fcf55a015d017f0','ipfs://bafy4348bd871caf0b9a14b9b09f9de88cec5b1db3a9bbaac2','2026-09-21 20:35:41',NULL,NULL,NULL);
/*!40000 ALTER TABLE `warranties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'digiproof'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22 21:04:47
