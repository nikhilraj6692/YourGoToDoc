package com.mediconnect;

/**
 * Custom exception for slot-related operations in the schedule service
 */
public class SlotException extends RuntimeException {

    private final String errorCode;

    // Constructor with error code and message
    public SlotException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    // Constructor with error code, message, and cause
    public SlotException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    // Constructor with error code and cause (message will be from cause)
    public SlotException(String errorCode, Throwable cause) {
        super(cause);
        this.errorCode = errorCode;
    }

    // Getter for error code
    public String getErrorCode() {
        return errorCode;
    }

    // Override toString for better logging
    @Override
    public String toString() {
        return String.format("SlotException[errorCode=%s, message=%s]",
                errorCode, getMessage());
    }

    // Predefined error codes as constants for consistency
    public static final class ErrorCodes {
        public static final String INVALID_SLOT_DURATION = "SLOT_001";
        public static final String INVALID_GAP_DURATION = "SLOT_002";
        public static final String INVALID_TIME_COMBINATION = "SLOT_003";
        public static final String SLOT_OVERLAP = "SLOT_004";
        public static final String SLOT_NOT_FOUND = "SLOT_005";
        public static final String UNAUTHORIZED_ACCESS = "SLOT_006";
        public static final String PAST_DATE_OPERATION = "SLOT_007";
        public static final String EXTENSION_CONFLICT = "SLOT_008";
        public static final String BOOKED_SLOT_CONFLICT = "SLOT_009";
        public static final String MINIMUM_DURATION_VIOLATION = "SLOT_010";
        public static final String NEXT_MONTH_RESTRICTION = "SLOT_011";
        public static final String SLOT_LARGE = "SLOT_012";

        // Private constructor to prevent instantiation
        private ErrorCodes() {}
    }

    // Convenience factory methods for common exceptions
    public static SlotException invalidDuration(int duration) {
        return new SlotException(ErrorCodes.INVALID_SLOT_DURATION,
                String.format("Slot duration %d minutes is invalid. Minimum is 20 minutes.", duration));
    }

    public static SlotException slotNotFound(String slotId) {
        return new SlotException(ErrorCodes.SLOT_NOT_FOUND,
                String.format("Slot with ID '%s' not found.", slotId));
    }

    public static SlotException unauthorizedAccess(String doctorId, String resourceId) {
        return new SlotException(ErrorCodes.UNAUTHORIZED_ACCESS,
                String.format("Doctor '%s' is not authorized to access resource '%s'.", doctorId, resourceId));
    }

    public static SlotException slotOverlap(String timeRange) {
        return new SlotException(ErrorCodes.SLOT_OVERLAP,
                String.format("Slot overlaps with existing slot at %s.", timeRange));
    }

    public static SlotException extensionConflict(String conflictDetails) {
        return new SlotException(ErrorCodes.EXTENSION_CONFLICT,
                String.format("Cannot extend slot due to conflicts: %s", conflictDetails));
    }

    public static SlotException bookedSlotConflict(String bookedSlotDetails) {
        return new SlotException(ErrorCodes.BOOKED_SLOT_CONFLICT,
                String.format("Cannot modify slot. Conflicts with booked appointment: %s", bookedSlotDetails));
    }

    public static SlotException slotLargeConflict() {
        return new SlotException(ErrorCodes.SLOT_LARGE,
                "Cannot add a slot. Please reduce slot duration");
    }
}
