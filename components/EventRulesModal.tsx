"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface EventRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventRulesModal({ 
  isOpen, 
  onClose, 
}: EventRulesModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl max-h-[calc(100vh-10rem)] overflow-auto" style={{ backgroundColor: '#f8f6ed' }}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-center font-display text-4xl md:text-2xl font-extrabold text-black tracking-wide mb-4">
            Penny Ante Poker Club Home Game House Rules
          </DialogTitle>
          <DialogDescription className="text-center text-black text-base">
            Private Poker Cash Game Rules / Participant Agreement
          </DialogDescription>
        </DialogHeader>
        <DialogDescription className="text-black text-base">
          <ol className="list-decimal pl-6 space-y-4">
            <li className="font-bold">Game Format</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>Private social home poker cash game</li>
              <li>Games may include No-Limit Texas Hold'em (NLHE) and Mixed Games</li>
              <li>Buy-in range: $25 minimum to $100 maximum (unless otherwise posted for a specific game night)</li>
              <li>No rake, no house cut, no time charge</li>
              <li>Any game rotation, stakes, and betting structure for the night will be announced before play</li>
            </ul>

            <li className="font-bold">Player Funds and Chips</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>Players buy chips directly into the game within the posted buy-in range.</li>
              <li>The host does not take any portion of player buy-ins, pots, or cash-outs.</li>
              <li>Chips are for use in this private game only and are redeemed per house cash-game procedures at the end of play.</li>
            </ul>

            <li className="font-bold">Food and Beverages</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>Food and beverages are provided by the host as hospitality.</li>
              <li>Food and beverages are not a condition of participation and are not sold as part of entry.</li>
              <li>Players may bring optional potluck items, but this is not required to play.</li>
            </ul>

            <li className="font-bold">Dealer Appreciation (Optional)</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dealer appreciation is optional and not required to play.</li>
              <li>Any dealer appreciation is handled separately from player buy-ins and gameplay.</li>
              <li>Contributing or not contributing does not affect seating, chips, gameplay, or eligibility.</li>
            </ul>

            <li className="font-bold">Equal Terms of Play</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>All players participate on equal terms.</li>
              <li>No player receives extra chips, preferred seating, or gameplay advantages in exchange for payments, donations, or purchases.</li>
              <li>House rules apply equally to all players.</li>
            </ul>

            <li className="font-bold">Conduct and Sportsmanship</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>Be respectful to all players and the host.</li>
              <li>No abusive behavior, harassment, cheating, or angle shooting.</li>
              <li>Protect your hand and act in turn.</li>
              <li>Verbal declarations are binding.</li>
              <li>The host/floor decision is final for house-rule disputes.</li>
            </ul>

            <li className="font-bold">Eligibility</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>This is a private home game for invited players only.</li>
              <li>Players must be 18+.</li>
              <li>The host reserves the right to refuse entry or remove any player for disruptive behavior.</li>
            </ul>

            <li className="font-bold">Compliance and Game Integrity</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>This is intended to be a private social game.</li>
              <li>No house fee, seat fee, membership fee, or hospitality charge is required to participate.</li>
              <li>No purchase of food or beverages is required to play.</li>
            </ul>

            <li className="font-bold">Acknowledgment</li>
            <ul className="list-disc pl-6 space-y-1">
              <li>By participating, players acknowledge they understand and agree to these house rules.</li>
            </ul>

          </ol>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}