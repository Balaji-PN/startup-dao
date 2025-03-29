// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StartupFunding {
    struct Proposal {
        address payable creator;
        string title;
        string description;
        uint256 fundingGoal;
        uint256 amountRaised;
        uint256 deadline;
        bool claimed;
        bool active;
    }

    // Mapping from proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    // Mapping from proposal ID to contributor address to amount contributed
    mapping(uint256 => mapping(address => uint256)) public contributions;
    // Total number of proposals
    uint256 public proposalCount;

    // Events
    event ProposalCreated(uint256 proposalId, address creator, string title, uint256 fundingGoal, uint256 deadline);
    event ContributionMade(uint256 proposalId, address contributor, uint256 amount);
    event FundsClaimed(uint256 proposalId, address creator, uint256 amount);
    event RefundIssued(uint256 proposalId, address contributor, uint256 amount);

    // Create a new funding proposal
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _durationInDays
    ) public returns (uint256) {
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");

        uint256 proposalId = proposalCount++;
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);

        proposals[proposalId] = Proposal({
            creator: payable(msg.sender),
            title: _title,
            description: _description,
            fundingGoal: _fundingGoal,
            amountRaised: 0,
            deadline: deadline,
            claimed: false,
            active: true
        });

        emit ProposalCreated(proposalId, msg.sender, _title, _fundingGoal, deadline);
        return proposalId;
    }

    // Contribute to a proposal
    function contribute(uint256 _proposalId) public payable {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.creator != address(0), "Proposal does not exist");
        require(block.timestamp < proposal.deadline, "Funding period has ended");
        require(proposal.active, "Proposal is not active");
        require(msg.value > 0, "Contribution must be greater than 0");

        proposal.amountRaised += msg.value;
        contributions[_proposalId][msg.sender] += msg.value;

        emit ContributionMade(_proposalId, msg.sender, msg.value);
    }

    // Creator claims funds if goal is reached and deadline passed
    function claimFunds(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];
        
        require(msg.sender == proposal.creator, "Only creator can claim funds");
        require(block.timestamp >= proposal.deadline, "Funding period not yet over");
        require(proposal.amountRaised >= proposal.fundingGoal, "Funding goal not reached");
        require(!proposal.claimed, "Funds already claimed");
        require(proposal.active, "Proposal is not active");

        proposal.claimed = true;
        proposal.active = false;

        uint256 amount = proposal.amountRaised;
        proposal.creator.transfer(amount);

        emit FundsClaimed(_proposalId, proposal.creator, amount);
    }

    // Get refund if goal is not reached and deadline passed
    function getRefund(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp >= proposal.deadline, "Funding period not yet over");
        require(proposal.amountRaised < proposal.fundingGoal, "Funding goal reached, cannot refund");
        require(proposal.active, "Proposal is not active");
        require(contributions[_proposalId][msg.sender] > 0, "No contribution found");

        uint256 amount = contributions[_proposalId][msg.sender];
        contributions[_proposalId][msg.sender] = 0;

        if (proposal.amountRaised == 0) {
            proposal.active = false;
        }

        payable(msg.sender).transfer(amount);

        emit RefundIssued(_proposalId, msg.sender, amount);
    }

    // Get proposal details
    function getProposal(uint256 _proposalId) public view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 fundingGoal,
        uint256 amountRaised,
        uint256 deadline,
        bool claimed,
        bool active
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.creator,
            proposal.title,
            proposal.description,
            proposal.fundingGoal,
            proposal.amountRaised,
            proposal.deadline,
            proposal.claimed,
            proposal.active
        );
    }

    // Get contribution amount
    function getContribution(uint256 _proposalId, address _contributor) public view returns (uint256) {
        return contributions[_proposalId][_contributor];
    }
} 