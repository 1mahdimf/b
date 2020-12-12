-- phpMyAdmin SQL Dump
-- version 4.6.6
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 07, 2020 at 11:42 PM
-- Server version: 5.7.30-0ubuntu0.18.04.1
-- PHP Version: 5.6.40-14+ubuntu18.04.1+deb.sury.org+1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bors`
--

-- --------------------------------------------------------

--
-- Table structure for table `analyzer`
--

CREATE TABLE `analyzer` (
  `id` int(10) NOT NULL,
  `name` varchar(45) COLLATE utf8_unicode_ci NOT NULL,
  `groupName` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL,
  `isin` varchar(25) COLLATE utf8_unicode_ci NOT NULL,
  `insCode` varchar(25) COLLATE utf8_unicode_ci NOT NULL,
  `date` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `highPrice` int(10) NOT NULL,
  `lowPrice` int(10) NOT NULL,
  `lastTradePrice` int(10) NOT NULL,
  `finalPrice` int(10) NOT NULL,
  `fallResistancePercent` int(5) NOT NULL,
  `minTradePrice` int(10) NOT NULL,
  `maxTradePrice` int(10) NOT NULL,
  `noBuyReal` int(10) DEFAULT '0',
  `volumeBuyReal` int(20) DEFAULT '0',
  `noSellReal` int(10) DEFAULT '0',
  `volumeSellReal` int(20) DEFAULT '0',
  `noBuyLegal` int(10) DEFAULT '0',
  `volumeBuyLegal` int(20) DEFAULT '0',
  `noSellLegal` int(10) DEFAULT '0',
  `volumeSellLegal` int(20) DEFAULT '0',
  `floating` int(5) NOT NULL,
  `volumeBase` int(20) DEFAULT NULL,
  `EPS` int(10) DEFAULT NULL,
  `PE` int(10) DEFAULT NULL,
  `groupPE` int(10) DEFAULT NULL,
  `maxVolumeOneTime` int(20) DEFAULT NULL,
  `maxVolumePriceOneTime` int(10) DEFAULT NULL,
  `maxVolumeTimeOneTime` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status20percent` tinyint(1) NOT NULL DEFAULT '0',
  `status50percent` tinyint(1) NOT NULL DEFAULT '0',
  `statusReopening` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `analyzer_table`
--

CREATE TABLE `analyzer_table` (
  `id` int(11) NOT NULL,
  `analyzerId` int(11) NOT NULL,
  `row` int(11) NOT NULL DEFAULT '1',
  `priceBuy` int(10) DEFAULT '0',
  `noBuy` int(10) DEFAULT '0',
  `volumeBuy` int(20) DEFAULT '0',
  `priceSell` int(10) DEFAULT '0',
  `noSell` int(10) DEFAULT '0',
  `volumeSell` int(20) DEFAULT '0',
  `lastTradePrice` int(10) DEFAULT '0',
  `volumeTrade` int(20) DEFAULT '0',
  `countTrade` int(10) DEFAULT '0',
  `time` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `text` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `analyzer`
--
ALTER TABLE `analyzer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `analyzer_table`
--
ALTER TABLE `analyzer_table`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_analyzer_table_analyzer1_idx` (`analyzerId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `analyzer`
--
ALTER TABLE `analyzer`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `analyzer_table`
--
ALTER TABLE `analyzer_table`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- Constraints for dumped tables
--

--
-- Constraints for table `analyzer_table`
--
ALTER TABLE `analyzer_table`
  ADD CONSTRAINT `fk_analyzer_table_analyzer1` FOREIGN KEY (`analyzerId`) REFERENCES `analyzer` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;


ALTER TABLE `analyzer` ADD `jDate` VARCHAR(10) NOT NULL AFTER `insCode`;
ALTER TABLE `analyzer` CHANGE `date` `date` DATE NOT NULL;
ALTER TABLE `analyzer` CHANGE `volumeBase` `basisVolume` INT(20) NULL DEFAULT NULL;
ALTER TABLE `analyzer` ADD `lastTradeDateTime` VARCHAR(25) NULL AFTER `lowPrice`;
ALTER TABLE `analyzer` ADD `noTrade` INT(10) NULL AFTER `maxTradePrice`, ADD `volumeTrade` INT(20) NULL AFTER `noTrade`;
ALTER TABLE `analyzer` CHANGE `PE` `PE` DECIMAL(10,2) NULL DEFAULT NULL, CHANGE `groupPE` `groupPE` DECIMAL(10,2) NULL DEFAULT NULL;

ALTER TABLE `analyzer` CHANGE `fallResistancePercent` `fallResistancePercent` INT(5) NULL;


--
-- Table structure for table `analyzer_queue`
--

CREATE TABLE `analyzer_queue` (
  `id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `isin` varchar(20) NOT NULL,
  `date` varchar(20) NOT NULL,
  `time` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `priceBuy` int(10) DEFAULT '0',
  `noBuy` int(10) DEFAULT '0',
  `volumeBuy` int(20) DEFAULT '0',
  `priceSell` int(10) DEFAULT '0',
  `noSell` int(10) DEFAULT '0',
  `volumeSell` int(20) DEFAULT '0',
  `volumeTrade` int(20) DEFAULT '0',
  `countTrade` int(10) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `analyzer_queue` ADD PRIMARY KEY(`id`);
ALTER TABLE `analyzer_queue` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
