// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library FamilyTypes {
    // enum ChildType {
    //     BIOLOGICAL,
    //     ADOPTED,
    //     STEP
    // }
    enum Sex {
        MALE,
        FEMALE,
        UNDEFINE
    }

        // Cấu trúc mới để lưu ngày tháng linh hoạt
    struct DateInfo {
        uint16 year;
        uint8 month; // 0 nếu không xác định
        uint8 day;   // 0 nếu không xác định
    }

    // struct Child {
    //     // ChildType childType;
    //     bytes32 childId;
    // }

    // struct Spouse {
    //     bytes32 spouseId;
    //     DateInfo marriedDate;  // Cập nhật sang DateInfo
    //     DateInfo divorcedDate; // Cập nhật sang DateInfo
    // }


    struct Person {
        string name;          
        bytes32 fatherId;
        bytes32 motherId;
        bytes32[] children;
        bytes32[] spouses;
        Sex sex;
        DateInfo birthDate;   
        DateInfo deathDate;    
        string shortDesc;     
    }
}
