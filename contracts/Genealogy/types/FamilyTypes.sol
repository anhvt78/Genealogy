// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FamilyTypes {
    enum ChildType {
        BIOLOGICAL,
        ADOPTED,
        STEP
    }
    enum Sex {
        MALE,
        FEMALE,
        UNDEFINE
    }

    struct Child {
        ChildType childType;
        bytes32 childId;
    }

    struct Spouse {
        bytes32 spouseId;
        uint256 marriedAt;
        uint256 divorcedAt;
    }


    struct Person {
        string name;
        address ownership;
        bytes32 fatherId;
        bytes32 motherId;
        Child[] children;
        Spouse[] spouses;
        Sex sex;
        string birthTimestamp;
        string deathTimestamp;
    }
}
