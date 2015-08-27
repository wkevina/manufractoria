var codeCell = codeCell || {},
    core = core || {},
    program = program || {};

(function (core, program) {
    var codeCells = {

        /**
         Conveyor

         Moves execution UP to the next cell
         Makes no changes to the tape
         */
        Conveyor: function Conveyor(head) {
            return [false, null, program.directions.UP];
        },

        /**
         BranchBR

         If head is RED, pop tape and move LEFT
         If head is BLUE, pop tape and move RIGHT
         Otherwise, don't pop and move UP
         */
        BranchBR: function BranchBR(head) {
            if (head === core.RED) {
                return [true, null, program.directions.LEFT];
            }

            if (head === core.BLUE) {
                return [true, null, program.directions.RIGHT];
            }

            return [false, null, program.directions.UP];
        }

    };

    codeCell.codeCells = codeCells;

})(core, program);
