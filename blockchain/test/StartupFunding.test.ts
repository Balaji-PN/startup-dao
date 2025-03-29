import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("StartupFunding", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployStartupFundingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, investor1, investor2] = await ethers.getSigners();

    const StartupFunding = await ethers.getContractFactory("StartupFunding");
    const startupFunding = await StartupFunding.deploy();

    return { startupFunding, owner, investor1, investor2 };
  }

  describe("Deployment", function () {
    it("Should set the proposal count to 0", async function () {
      const { startupFunding } = await loadFixture(deployStartupFundingFixture);
      expect(await startupFunding.proposalCount()).to.equal(0);
    });
  });

  describe("Proposals", function () {
    it("Should create a new proposal", async function () {
      const { startupFunding, owner } = await loadFixture(deployStartupFundingFixture);
      
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const fundingGoal = ethers.parseEther("10");
      const durationInDays = 30;
      
      await startupFunding.createProposal(title, description, fundingGoal, durationInDays);
      
      expect(await startupFunding.proposalCount()).to.equal(1);
      
      const proposal = await startupFunding.getProposal(0);
      expect(proposal.creator).to.equal(owner.address);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.fundingGoal).to.equal(fundingGoal);
      expect(proposal.amountRaised).to.equal(0);
      expect(proposal.claimed).to.equal(false);
      expect(proposal.active).to.equal(true);
    });
    
    it("Should revert if funding goal is 0", async function () {
      const { startupFunding } = await loadFixture(deployStartupFundingFixture);
      
      await expect(
        startupFunding.createProposal("Test", "Description", 0, 30)
      ).to.be.revertedWith("Funding goal must be greater than 0");
    });
    
    it("Should revert if duration is 0", async function () {
      const { startupFunding } = await loadFixture(deployStartupFundingFixture);
      
      await expect(
        startupFunding.createProposal("Test", "Description", ethers.parseEther("10"), 0)
      ).to.be.revertedWith("Duration must be greater than 0");
    });
  });

  describe("Funding", function () {
    it("Should allow contributions to a proposal", async function () {
      const { startupFunding, owner, investor1 } = await loadFixture(deployStartupFundingFixture);
      
      // Create proposal
      await startupFunding.createProposal(
        "Test Proposal", 
        "Description", 
        ethers.parseEther("10"),
        30
      );
      
      // Contribute to proposal
      const contribution = ethers.parseEther("2");
      await startupFunding.connect(investor1).contribute(0, { value: contribution });
      
      // Check proposal was updated
      const proposal = await startupFunding.getProposal(0);
      expect(proposal.amountRaised).to.equal(contribution);
      
      // Check contribution was recorded
      const investorContribution = await startupFunding.getContribution(0, investor1.address);
      expect(investorContribution).to.equal(contribution);
    });
    
    it("Should reject contributions to non-existent proposals", async function () {
      const { startupFunding, investor1 } = await loadFixture(deployStartupFundingFixture);
      
      await expect(
        startupFunding.connect(investor1).contribute(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Proposal does not exist");
    });
    
    it("Should reject zero value contributions", async function () {
      const { startupFunding, investor1 } = await loadFixture(deployStartupFundingFixture);
      
      // Create proposal
      await startupFunding.createProposal(
        "Test Proposal", 
        "Description", 
        ethers.parseEther("10"),
        30
      );
      
      await expect(
        startupFunding.connect(investor1).contribute(0, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });
  });

  describe("Claims and Refunds", function () {
    it("Should allow creator to claim funds when goal is reached", async function () {
      const { startupFunding, owner, investor1, investor2 } = await loadFixture(deployStartupFundingFixture);
      
      // Create proposal
      const fundingGoal = ethers.parseEther("10");
      await startupFunding.createProposal("Test", "Description", fundingGoal, 30);
      
      // Fund the proposal
      await startupFunding.connect(investor1).contribute(0, { value: ethers.parseEther("6") });
      await startupFunding.connect(investor2).contribute(0, { value: ethers.parseEther("4") });
      
      // Advance time past deadline
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine", []);
      
      // Check balance before claim
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Claim funds
      await startupFunding.connect(owner).claimFunds(0);
      
      // Check proposal status
      const proposal = await startupFunding.getProposal(0);
      expect(proposal.claimed).to.equal(true);
      expect(proposal.active).to.equal(false);
      
      // Check balance after claim (should increase by total funded amount)
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Account for gas fees in the comparison (so we check balanceAfter is significantly higher)
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
    
    it("Should allow refunds when goal is not reached", async function () {
      const { startupFunding, investor1 } = await loadFixture(deployStartupFundingFixture);
      
      // Create proposal
      await startupFunding.createProposal(
        "Test Proposal", 
        "Description", 
        ethers.parseEther("10"),
        30
      );
      
      // Contribute less than goal
      const contribution = ethers.parseEther("2");
      await startupFunding.connect(investor1).contribute(0, { value: contribution });
      
      // Advance time past deadline
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await ethers.provider.send("evm_mine", []);
      
      // Check balance before refund
      const balanceBefore = await ethers.provider.getBalance(investor1.address);
      
      // Get refund
      await startupFunding.connect(investor1).getRefund(0);
      
      // Check contribution is reset
      const investorContribution = await startupFunding.getContribution(0, investor1.address);
      expect(investorContribution).to.equal(0);
      
      // Check balance after refund (should increase close to contribution amount)
      const balanceAfter = await ethers.provider.getBalance(investor1.address);
      
      // Account for gas fees in the comparison
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
}); 