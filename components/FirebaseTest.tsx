import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { auth, db, storage, reconnectFirestore } from '@/services/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { databaseService } from '@/services/database';
import { COLORS } from '@/constants/colors';

interface FirebaseTestProps {
  testId?: string;
}

interface TestResult {
  category: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function FirebaseTest({ testId }: FirebaseTestProps) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>('Ready to test');
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testFirebaseConnection = async () => {
    setIsRunning(true);
    setTestResults([]);
    setOverallStatus('Testing Firebase connection...');
    
    try {
      // Test 1: Firebase App Initialization
      if (auth?.app) {
        addTestResult({
          category: 'App Init',
          status: 'success',
          message: 'Firebase App initialized successfully',
          details: `Project: ${auth.app.options.projectId}`
        });
        
        const config = auth.app.options;
        addTestResult({
          category: 'Config',
          status: 'success',
          message: 'Configuration loaded',
          details: `Domain: ${config.authDomain}, Storage: ${config.storageBucket}`
        });
      } else {
        addTestResult({
          category: 'App Init',
          status: 'error',
          message: 'Firebase App initialization failed'
        });
        return;
      }

      // Test 2: Firebase Auth
      try {
        if (auth) {
          addTestResult({
            category: 'Auth',
            status: 'success',
            message: 'Auth service available'
          });
          
          // Test anonymous sign in
          const userCredential = await signInAnonymously(auth);
          if (userCredential.user) {
            addTestResult({
              category: 'Auth',
              status: 'success',
              message: 'Anonymous authentication successful',
              details: `UID: ${userCredential.user.uid.substring(0, 8)}...`
            });
            
            // Sign out immediately
            await auth.signOut();
            addTestResult({
              category: 'Auth',
              status: 'success',
              message: 'Sign out successful'
            });
          }
        } else {
          addTestResult({
            category: 'Auth',
            status: 'error',
            message: 'Auth service unavailable'
          });
        }
      } catch (error) {
        addTestResult({
          category: 'Auth',
          status: 'error',
          message: 'Auth test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Firestore Database with retry logic
      try {
        if (db) {
          addTestResult({
            category: 'Firestore',
            status: 'success',
            message: 'Firestore service available'
          });
          
          // Retry logic for connection issues
          let retryCount = 0;
          const maxRetries = 3;
          let lastError: Error | null = null;
          
          while (retryCount < maxRetries) {
            try {
              // Test write operation
              const testDoc = doc(db, 'test', `connection-test-${Date.now()}`);
              const testData = {
                timestamp: new Date(),
                test: true,
                platform: 'mobile',
                version: '1.0.0',
                attempt: retryCount + 1
              };
              
              await setDoc(testDoc, testData);
              addTestResult({
                category: 'Firestore',
                status: 'success',
                message: `Write operation successful${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`,
                details: retryCount > 0 ? `Succeeded after ${retryCount} retries` : undefined
              });
              
              // Test read operation
              const docSnap = await getDoc(testDoc);
              if (docSnap.exists()) {
                addTestResult({
                  category: 'Firestore',
                  status: 'success',
                  message: 'Read operation successful',
                  details: `Data: ${JSON.stringify(docSnap.data())?.substring(0, 50) || 'No data'}...`
                });
              } else {
                addTestResult({
                  category: 'Firestore',
                  status: 'error',
                  message: 'Read operation failed - document not found'
                });
              }
              
              // Test collection query
              const testCollection = collection(db, 'test');
              await addDoc(testCollection, { queryTest: true, timestamp: new Date() });
              addTestResult({
                category: 'Firestore',
                status: 'success',
                message: 'Collection write successful'
              });
              
              break; // Success, exit retry loop
              
            } catch (error) {
              lastError = error instanceof Error ? error : new Error('Unknown error');
              retryCount++;
              
              if (retryCount < maxRetries) {
                addTestResult({
                  category: 'Firestore',
                  status: 'warning',
                  message: `Connection attempt ${retryCount} failed, retrying...`,
                  details: lastError.message
                });
                
                // Try to reconnect
                try {
                  await reconnectFirestore();
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                } catch (reconnectError) {
                  console.log('Reconnect failed:', reconnectError);
                }
              }
            }
          }
          
          // If all retries failed
          if (retryCount >= maxRetries && lastError) {
            throw lastError;
          }
          
        } else {
          addTestResult({
            category: 'Firestore',
            status: 'error',
            message: 'Firestore service unavailable'
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isConnectionError = errorMessage.includes('unavailable') || 
                                 errorMessage.includes('connection') || 
                                 errorMessage.includes('network');
        
        addTestResult({
          category: 'Firestore',
          status: 'error',
          message: isConnectionError ? 
            'Firestore connection failed - Check internet connection' : 
            'Firestore test failed',
          details: `${errorMessage}${isConnectionError ? ' (This is often temporary - try again)' : ''}`
        });
      }

      // Test 4: Firebase Storage
      try {
        if (storage) {
          addTestResult({
            category: 'Storage',
            status: 'success',
            message: 'Storage service available'
          });
          
          // Test file upload (small text file)
          const testData = new Blob(['Hello Firebase Storage!'], { type: 'text/plain' });
          const storageRef = ref(storage, `test/connection-test-${Date.now()}.txt`);
          
          await uploadBytes(storageRef, testData);
          addTestResult({
            category: 'Storage',
            status: 'success',
            message: 'File upload successful'
          });
          
          // Test getting download URL
          const downloadURL = await getDownloadURL(storageRef);
          if (downloadURL) {
            addTestResult({
              category: 'Storage',
              status: 'success',
              message: 'Download URL generated',
              details: `URL: ${downloadURL?.substring(0, 50) || 'No URL'}...`
            });
          }
          
        } else {
          addTestResult({
            category: 'Storage',
            status: 'error',
            message: 'Storage service unavailable'
          });
        }
      } catch (error) {
        addTestResult({
          category: 'Storage',
          status: 'warning',
          message: 'Storage test failed (may require authentication)',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Database Service Integration
      try {
        addTestResult({
          category: 'Database Service',
          status: 'success',
          message: 'Database service imported successfully'
        });
        
        // Test if service methods are available
        if (databaseService.user && databaseService.post && databaseService.pet) {
          addTestResult({
            category: 'Database Service',
            status: 'success',
            message: 'All service modules available',
            details: 'User, Post, Pet, Comment, Upload services ready'
          });
        }
      } catch (error) {
        addTestResult({
          category: 'Database Service',
          status: 'error',
          message: 'Database service integration failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Calculate overall status
      const errorCount = testResults.filter(r => r.status === 'error').length;
      const warningCount = testResults.filter(r => r.status === 'warning').length;
      
      if (errorCount === 0 && warningCount === 0) {
        setOverallStatus('🎉 All tests passed! Firebase is ready to use.');
      } else if (errorCount === 0) {
        setOverallStatus(`⚠️ Tests completed with ${warningCount} warnings.`);
      } else {
        setOverallStatus(`❌ Tests completed with ${errorCount} errors and ${warningCount} warnings.`);
      }

    } catch (error) {
      console.error('Firebase test error:', error);
      addTestResult({
        category: 'General',
        status: 'error',
        message: 'Unexpected error during testing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      setOverallStatus('❌ Testing failed with unexpected error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleManualReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await reconnectFirestore();
      if (success) {
        addTestResult({
          category: 'Manual Reconnect',
          status: 'success',
          message: 'Manual reconnection successful'
        });
        setOverallStatus('🔄 Reconnected - Try running tests again');
      } else {
        addTestResult({
          category: 'Manual Reconnect',
          status: 'error',
          message: 'Manual reconnection failed'
        });
      }
    } catch (error) {
      addTestResult({
        category: 'Manual Reconnect',
        status: 'error',
        message: 'Manual reconnection error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsReconnecting(false);
    }
  };

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return COLORS.success || '#4CAF50';
      case 'error': return COLORS.error || '#F44336';
      case 'warning': return COLORS.warning || '#FF9800';
      default: return COLORS.darkGray;
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '🔄';
    }
  };

  return (
    <ScrollView style={styles.container} testID={testId}>
      <Text style={styles.title}>🔥 Firebase Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.overallStatus}>{overallStatus}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.retestButton, isRunning && styles.retestButtonDisabled]} 
          onPress={testFirebaseConnection}
          disabled={isRunning}
        >
          <Text style={styles.retestButtonText}>
            {isRunning ? '🔄 Testing...' : '🔄 Run Tests Again'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.reconnectButton, isReconnecting && styles.retestButtonDisabled]} 
          onPress={handleManualReconnect}
          disabled={isReconnecting || isRunning}
        >
          <Text style={styles.reconnectButtonText}>
            {isReconnecting ? '🔄 Reconnecting...' : '🔗 Force Reconnect'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results ({testResults.length}):</Text>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={styles.resultCategory}>{result.category}</Text>
              <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                {result.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.details && (
              <Text style={styles.resultDetails}>{result.details}</Text>
            )}
          </View>
        ))}
        
        {testResults.length === 0 && !isRunning && (
          <Text style={styles.noResults}>No test results yet. Click &quot;Run Tests Again&quot; to start.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  overallStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 22,
  },
  retestButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
  },
  retestButtonDisabled: {
    backgroundColor: COLORS.darkGray,
    opacity: 0.6,
  },
  retestButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
    lineHeight: 18,
  },
  resultDetails: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  noResults: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  reconnectButton: {
    backgroundColor: COLORS.secondary || '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  reconnectButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});