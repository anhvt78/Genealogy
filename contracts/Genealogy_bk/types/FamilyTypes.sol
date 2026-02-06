// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title FamilyTypes
/// @notice Chỉ chứa các định nghĩa struct và enum chung cho hệ thống gia phả
contract FamilyTypes {
    enum ChildType { BIOLOGICAL, ADOPTED, STEP }
    enum Sex { MALE, FEMALE, UNDEFINE }
    enum LinkType { FATHER, MOTHER, SPOUSE, CHILD }

    struct Child {
        ChildType childType;
        bytes32 childId;
    }

    struct Spouse {
        bytes32 spouseId;
        uint256 marriedAt;
        uint256 divorcedAt;
    }

    struct ClanLink {
        address clanAddress;
        bytes32 clanId;
        LinkType linkType;
    }

    struct Person {
        string name;
        address ownership;
        bytes32 fatherId;
        bytes32 motherId;
        Child[] children;
        Spouse[] spouses;
        Sex sex;
        bytes profileCID;
        uint256 birthTimestamp;
        uint256 deathTimestamp;
        ClanLink clanLink;
        bool isLinked;
    }

    struct Clan {
        string name;
        bytes profileCID;
        address nftAddress;
    }
}