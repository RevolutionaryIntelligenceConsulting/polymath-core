import { convertHex, ensureException, duration } from './helpers/utils.js';
import latestTime from './helpers/latestTime';

const SecurityTokenRegistrar = artifacts.require('./SecurityTokenRegistrar.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const POLY = artifacts.require('./helpers/mockContracts/PolyTokenMock.sol');
const Compliance = artifacts.require('./Compliance.sol');
const Customers = artifacts.require('./Customers.sol');


contract('SecurityTokenRegistrar', accounts => {

  //createSecurityToken variables
  const name = 'Polymath Inc.';
  const ticker = 'POLY';
  const totalSupply = 1234567890;
  const maxPoly = 100000;
  const securityType = 5;
  const numberOfSecurityTypes = 8;                                           //8 is chosen for testing,
  const nameSpaceMixed = "TestNameSpace";
  const nameSpace = "testnamespace";
  const nameSpaceFee = 10000;
  const nameSpaceOwner = accounts[6];
  const quorum = 3;
  const lockupPeriod = latestTime() + duration.years(1);                      //Current time + 1 year is the locking period (Testing Only)
  const getAmount = 1000000;
  const approvedAmount = 10000;

  //accounts
  let owner = accounts[0];
  let acct1 = accounts[1];
  let acct2 = accounts[2];
  let issuer2 = accounts[3];
  let issuer1 = accounts[4];

  describe('Constructor', async () => {
    it('should have polyTokenAddress updated to contract storage', async () => {
      let polyToken = await POLY.new();
      let polyCustomers = await Customers.new(polyToken.address);
      let polyCompliance = await Compliance.new(polyCustomers.address);
      // Creation of the new SecurityTokenRegistrar contract
      let STRegistrar = await SecurityTokenRegistrar.new(
        polyToken.address,
        polyCustomers.address,
        polyCompliance.address
      );
      await polyCompliance.setRegistrarAddress(STRegistrar.address);
      let PTAddress = await STRegistrar.PolyToken.call();
      assert.strictEqual(PTAddress, polyToken.address);
    });
  });

  describe('function createSecurityToken', async () => {
    it('should allow for the creation of a Security Token.', async () => {
      let polyToken = await POLY.new();
      let polyCustomers = await Customers.new(polyToken.address);
      let polyCompliance = await Compliance.new(polyCustomers.address);
      // Creation of the new SecurityTokenRegistrar contract
      let STRegistrar = await SecurityTokenRegistrar.new(
        polyToken.address,
        polyCustomers.address,
        polyCompliance.address
      );
      // Allowance Provided to SecurityToken Registrar contract
      await polyToken.getTokens(getAmount, issuer1, { from : issuer1 });
      let issuerBalance = await polyToken.balanceOf(issuer1);
      assert.strictEqual(issuerBalance.toNumber(),getAmount);
      await polyToken.approve(STRegistrar.address, approvedAmount, { from : issuer1 });

      let allowedToken = await polyToken.allowance(issuer1, STRegistrar.address);
      assert.strictEqual(allowedToken.toNumber(),approvedAmount);
      console.log("BEF");
      // Create name space
      await STRegistrar.createNameSpace(
        nameSpaceMixed,
        nameSpaceOwner,
        nameSpaceFee
      )
      console.log("AFT");

      // Creation of the Security Token
      let ST = await STRegistrar.createSecurityToken(
        nameSpace,
        name,
        ticker,
        totalSupply,
        0,
        issuer1,
        numberOfSecurityTypes,
        {
          from: issuer1,
        },
      );
      let STAddress = await STRegistrar.getSecurityTokenAddress.call(nameSpace, ticker);
      assert.notEqual(STAddress, 0x0);
      let STData = await STRegistrar.getSecurityTokenData.call(STAddress);
      assert.strictEqual(STData[1], ticker);
    });

    //////////////////////////////////////
    //// createSecurityToken() Test Cases
    //////////////////////////////////////

    describe('Creation of SecurityTokenMetaData Struct is within its proper limitations', async () => {
      it('createSecurityToken:should fail when total supply is zero', async () => {
        let polyToken = await POLY.new();
        let polyCustomers = await Customers.new(polyToken.address);
        let polyCompliance = await Compliance.new(polyCustomers.address);
        let STRegistrar = await SecurityTokenRegistrar.new(
          polyToken.address,
          polyCustomers.address,
          polyCompliance.address
        );
        let totalSupply = 0;
        // Allowance Provided to SecurityToken Registrar contract
        await polyToken.getTokens(getAmount, issuer1, {from : issuer1 });
        let issuerBalance = await polyToken.balanceOf(issuer1);
        assert.strictEqual(issuerBalance.toNumber(), getAmount);
        await polyToken.approve(STRegistrar.address, approvedAmount, { from : issuer1 });

        // Create name space
        await STRegistrar.createNameSpace(
          nameSpaceMixed,
          nameSpaceOwner,
          nameSpaceFee
        )

        try{
            await STRegistrar.createSecurityToken(
              nameSpace,
              name,
              ticker,
              totalSupply,
              0,
              issuer1,
              numberOfSecurityTypes,
              {
                from : issuer1
              })
          } catch(error) {
              ensureException(error);
          }
      });

      it('createSecurityToken:should fail when name space does not exist', async () => {
        let polyToken = await POLY.new();
        let polyCustomers = await Customers.new(polyToken.address);
        let polyCompliance = await Compliance.new(polyCustomers.address);
        let STRegistrar = await SecurityTokenRegistrar.new(
          polyToken.address,
          polyCustomers.address,
          polyCompliance.address
        );
        let totalSupply = 115792089237316195423570985008687907853269984665640564039457584007913129639936;
        // Allowance Provided to SecurityToken Registrar contract
        await polyToken.getTokens(getAmount, issuer1, { from : issuer1 });
        let issuerBalance = await polyToken.balanceOf(issuer1);
        assert.strictEqual(issuerBalance.toNumber(), getAmount);
        await polyToken.approve(STRegistrar.address, approvedAmount, { from : issuer1 });

        try{
            await STRegistrar.createSecurityToken(
              nameSpace,
              name,
              ticker,
              totalSupply,
              0,
              issuer1,
              numberOfSecurityTypes,
              {
                from : issuer1
              })
          } catch(error) {
              ensureException(error);
          }
      });

      it('createSecurityToken:should fail when total supply is greater than (2^256)-1', async () => {
        let polyToken = await POLY.new();
        let polyCustomers = await Customers.new(polyToken.address);
        let polyCompliance = await Compliance.new(polyCustomers.address);
        let STRegistrar = await SecurityTokenRegistrar.new(
          polyToken.address,
          polyCustomers.address,
          polyCompliance.address
        );
        let totalSupply = 115792089237316195423570985008687907853269984665640564039457584007913129639936;
        // Allowance Provided to SecurityToken Registrar contract
        await polyToken.getTokens(getAmount, issuer1, { from : issuer1 });
        let issuerBalance = await polyToken.balanceOf(issuer1);
        assert.strictEqual(issuerBalance.toNumber(), getAmount);
        await polyToken.approve(STRegistrar.address, approvedAmount, { from : issuer1 });

        // Create name space
        await STRegistrar.createNameSpace(
          nameSpaceMixed,
          nameSpaceOwner,
          nameSpaceFee
        )

        try{
            await STRegistrar.createSecurityToken(
              nameSpace,
              name,
              ticker,
              totalSupply,
              0,
              issuer1,
              numberOfSecurityTypes,
              {
                from : issuer1
              })
          } catch(error) {
              ensureException(error);
          }
      });

      it("createSecurityToken:should fail when ticker name is already exist", async () => {
        let polyToken = await POLY.new();
        let polyCustomers = await Customers.new(polyToken.address);
        let polyCompliance = await Compliance.new(polyCustomers.address);
        let STRegistrar = await SecurityTokenRegistrar.new(
          polyToken.address,
          polyCustomers.address,
          polyCompliance.address
        );

        await polyToken.getTokens(getAmount, issuer1, { from : issuer1 });
        await polyToken.getTokens(getAmount, issuer2, { from : issuer2 });

        let issuerBalance1 = await polyToken.balanceOf(issuer1);
        let issuerBalance2 = await polyToken.balanceOf(issuer2);

        assert.strictEqual(issuerBalance1.toNumber(), getAmount);
        assert.strictEqual(issuerBalance2.toNumber(), getAmount);

        await polyToken.approve(STRegistrar.address, approvedAmount, { from : issuer1 });
        await polyToken.approve(STRegistrar.address, approvedAmount, { from : issuer2 });

        let allowedToken1 = await polyToken.allowance(issuer1, STRegistrar.address);
        assert.strictEqual(allowedToken1.toNumber(), approvedAmount);

        let allowedToken2 = await polyToken.allowance(issuer2, STRegistrar.address);
        assert.strictEqual(allowedToken2.toNumber(), approvedAmount);

        // Create name space
        await STRegistrar.createNameSpace(
          nameSpaceMixed,
          nameSpaceOwner,
          nameSpaceFee
        )

        let ST = await STRegistrar.createSecurityToken(
          nameSpace,
          name,
          ticker,
          totalSupply,
          0,
          issuer1,
          numberOfSecurityTypes,
          {
            from : issuer1
          });
        let STAddress = await STRegistrar.getSecurityTokenAddress.call(nameSpace, ticker);
        assert.notEqual(web3.eth.getCode(STAddress),0x0);
        try{
            let ST = await STRegistrar.createSecurityToken(
              nameSpace,
              name,
              ticker,
              totalSupply,
              0,
              issuer2,
              numberOfSecurityTypes,
              {
                from : issuer2
              });
            } catch(error){
                ensureException(error);
            }
      });

      it('createSecurityToken:should fail when the approved quantity is less than the fee', async () => {
        let polyToken = await POLY.new();
        let polyCustomers = await Customers.new(polyToken.address);
        let polyCompliance = await Compliance.new(polyCustomers.address);
        let STRegistrar = await SecurityTokenRegistrar.new(
          polyToken.address,
          polyCustomers.address,
          polyCompliance.address
        );

        await polyToken.getTokens(getAmount, issuer1, {from : issuer1 });
        await polyToken.approve(STRegistrar.address, 1000, {from:issuer1});

        // Create name space
        await STRegistrar.createNameSpace(
          nameSpaceMixed,
          nameSpaceOwner,
          nameSpaceFee
        )

        try {
            let ST = await STRegistrar.createSecurityToken(
              nameSpace,
              name,
              ticker,
              totalSupply,
              0,
              issuer1,
              numberOfSecurityTypes,
              {
                from: issuer1
              });
        } catch(error) {
              ensureException(error);
        }
      });

      it("createSecurityToken:should fail when the security registrar haven't approved to spent the poly" , async () => {
        let polyToken = await POLY.new();
        let polyCustomers = await Customers.new(polyToken.address);
        let polyCompliance = await Compliance.new(polyCustomers.address);
        let STRegistrar = await SecurityTokenRegistrar.new(
          polyToken.address,
          polyCustomers.address,
          polyCompliance.address
        );

        await polyToken.getTokens(getAmount, issuer1, {from : issuer1});

        // Create name space
        await STRegistrar.createNameSpace(
          nameSpaceMixed,
          nameSpaceOwner,
          nameSpaceFee
        )

        try {
              let ST = await STRegistrar.createSecurityToken(
                nameSpace,
                name,
                ticker,
                totalSupply,
                issuer1,
                0,
                numberOfSecurityTypes,
                {
                  from : issuer1
                });
        } catch(error) {
              ensureException(error);
        }
      });
    });
  });
});
